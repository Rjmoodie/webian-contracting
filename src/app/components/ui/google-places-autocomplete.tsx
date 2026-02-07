/**
 * Google Places Autocomplete Input
 *
 * Loads the Google Maps JS SDK lazily (once) with loading=async, then:
 *   1. Tries PlaceAutocompleteElement (new API — requires Places API (New) enabled)
 *   2. Falls back to legacy google.maps.places.Autocomplete if the new one isn't available
 *   3. Falls back to a plain text input if both fail or the API key is missing
 *
 * Always shows a "Enter manually" toggle so users can type even if the API is broken.
 *
 * Requires VITE_GOOGLE_MAPS_API_KEY to be set in .env.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/app/components/ui/input';
import { MapPin, Loader2, Keyboard } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
export interface PlaceResult {
  formattedAddress: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
}

interface GooglePlacesAutocompleteProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  /** Restrict results to this country (ISO 3166-1 alpha-2), e.g. "jm" for Jamaica */
  countryRestriction?: string;
  required?: boolean;
}

type AutocompleteMode = 'loading' | 'new_widget' | 'legacy' | 'manual';

// ── Script loader (singleton) ──────────────────────────────────
let _loadPromise: Promise<boolean> | null = null;

function loadGoogleMapsScript(): Promise<boolean> {
  if (_loadPromise) return _loadPromise;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  if (!apiKey || !apiKey.trim()) {
    _loadPromise = Promise.resolve(false);
    return _loadPromise;
  }

  // Already loaded (callback was run previously)
  if (typeof window !== 'undefined' && (window as unknown as { google?: { maps?: unknown } }).google?.maps) {
    _loadPromise = Promise.resolve(true);
    return _loadPromise;
  }

  _loadPromise = new Promise<boolean>((resolve) => {
    const callbackName = `__googleMapsPlacesReady_${Date.now()}__`;
    (window as unknown as Record<string, () => void>)[callbackName] = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      resolve(true);
    };
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&loading=async&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      delete (window as unknown as Record<string, () => void>)[callbackName];
      console.warn('[GooglePlaces] Failed to load Google Maps script');
      resolve(false);
    };
    document.head.appendChild(script);
  });

  return _loadPromise;
}

// ── Component ──────────────────────────────────────────────────
export default function GooglePlacesAutocomplete({
  id,
  value,
  onChange,
  onPlaceSelect,
  placeholder = 'Search for an address...',
  className = '',
  countryRestriction = 'jm',
  required = false,
}: GooglePlacesAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetSlotRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<unknown>(null);
  const [mode, setMode] = useState<AutocompleteMode>('loading');
  const [forceManual, setForceManual] = useState(false);
  const onChangeRef = useRef(onChange);
  const onPlaceSelectRef = useRef(onPlaceSelect);
  onChangeRef.current = onChange;
  onPlaceSelectRef.current = onPlaceSelect;

  // ── Load the Google Maps script once ─────────────────────
  useEffect(() => {
    let cancelled = false;
    loadGoogleMapsScript().then((ok) => {
      if (cancelled) return;
      if (!ok) {
        setMode('manual');
        return;
      }
      // Script loaded — try to initialise
      initAutocomplete().then((resolvedMode) => {
        if (!cancelled) setMode(resolvedMode);
      });
    });
    return () => { cancelled = true; };
  }, []);

  // ── Initialisation: try new API, then legacy, then manual ─
  async function initAutocomplete(): Promise<AutocompleteMode> {
    // 1) Try new PlaceAutocompleteElement
    try {
      const g = (window as unknown as { google?: { maps?: { importLibrary?: (name: string) => Promise<Record<string, unknown>> } } }).google;
      const importLib = g?.maps?.importLibrary;
      if (importLib) {
        const lib = await importLib('places');
        const PAE = lib.PlaceAutocompleteElement as (new (opts?: Record<string, unknown>) => HTMLElement) | undefined;
        if (PAE) {
          return 'new_widget';
        }
      }
    } catch {
      // new API not available
    }

    // 2) Try legacy Autocomplete
    try {
      const g = (window as unknown as { google?: { maps?: { places?: { Autocomplete?: unknown } } } }).google;
      if (g?.maps?.places?.Autocomplete) {
        return 'legacy';
      }
    } catch {
      // legacy not available
    }

    return 'manual';
  }

  // ── Mount new PlaceAutocompleteElement ────────────────────
  useEffect(() => {
    if (mode !== 'new_widget' || forceManual || !widgetSlotRef.current) return;
    const slot = widgetSlotRef.current;
    if (autocompleteRef.current) return;

    const mount = async () => {
      try {
        const g = (window as unknown as { google?: { maps?: { importLibrary: (name: string) => Promise<Record<string, unknown>> } } }).google;
        const lib = await g!.maps!.importLibrary('places');
        const PAE = lib.PlaceAutocompleteElement as new (opts?: Record<string, unknown>) => HTMLElement & {
          placeholder?: string; value?: string; includedRegionCodes?: string[];
          addEventListener(type: string, fn: (ev: unknown) => void): void;
        };

        const element = new PAE({
          placeholder,
          value: value ?? '',
          ...(countryRestriction ? { includedRegionCodes: [countryRestriction] } : {}),
        });
        if (id) element.id = id;

        // Listen for gmp-error to auto-fallback
        element.addEventListener('gmp-error', () => {
          console.warn('[GooglePlaces] PlaceAutocompleteElement error (API may not be enabled). Falling back to legacy.');
          slot.removeChild(element);
          autocompleteRef.current = null;
          setMode('legacy');
        });

        element.addEventListener('gmp-select', async (ev: unknown) => {
          try {
            const prediction = (ev as { placePrediction: { toPlace: () => Promise<{ fetchFields: (o: { fields: string[] }) => Promise<unknown>; formattedAddress?: string; location?: { lat: () => number; lng: () => number }; id?: string }> } }).placePrediction;
            const place = await prediction.toPlace();
            await place.fetchFields({ fields: ['formattedAddress', 'location', 'id'] });
            const formatted = place.formattedAddress ?? '';
            const lat = place.location?.lat() ?? null;
            const lng = place.location?.lng() ?? null;
            const placeId = place.id ?? null;
            onChangeRef.current(formatted);
            onPlaceSelectRef.current?.({ formattedAddress: formatted, lat, lng, placeId });
          } catch {
            // ignore
          }
        });

        slot.appendChild(element);
        autocompleteRef.current = element;
      } catch {
        // If mounting fails, drop to legacy
        setMode('legacy');
      }
    };
    mount();
  }, [mode, forceManual, countryRestriction, placeholder, id]);

  // ── Mount legacy Autocomplete ────────────────────────────
  useEffect(() => {
    if (mode !== 'legacy' || forceManual) return;
    const inputEl = containerRef.current?.querySelector('input');
    if (!inputEl || autocompleteRef.current) return;

    try {
      const g = (window as unknown as { google?: { maps?: { places?: { Autocomplete?: new (el: HTMLInputElement, opts?: Record<string, unknown>) => unknown } } } }).google;
      const Autocomplete = g?.maps?.places?.Autocomplete;
      if (!Autocomplete) {
        setMode('manual');
        return;
      }

      const ac = new Autocomplete(inputEl, {
        types: ['address'],
        componentRestrictions: countryRestriction ? { country: countryRestriction } : undefined,
        fields: ['formatted_address', 'geometry', 'place_id'],
      }) as {
        getPlace: () => { formatted_address?: string; geometry?: { location?: { lat(): number; lng(): number } }; place_id?: string };
        addListener: (event: string, fn: () => void) => void;
      };

      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        const formatted = place.formatted_address ?? '';
        const lat = place.geometry?.location?.lat() ?? null;
        const lng = place.geometry?.location?.lng() ?? null;
        const placeId = place.place_id ?? null;
        onChangeRef.current(formatted);
        onPlaceSelectRef.current?.({ formattedAddress: formatted, lat, lng, placeId });
      });

      autocompleteRef.current = ac;

      // Prevent form submit when selecting from dropdown
      inputEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          const pac = document.querySelector('.pac-container');
          if (pac && pac.querySelectorAll('.pac-item').length > 0) {
            e.preventDefault();
          }
        }
      });
    } catch (err) {
      console.warn('[GooglePlaces] Legacy Autocomplete init failed:', err);
      setMode('manual');
    }
  }, [mode, forceManual, countryRestriction]);

  // ── Sync controlled value into new widget ────────────────
  useEffect(() => {
    if (mode !== 'new_widget') return;
    const el = autocompleteRef.current as HTMLElement & { value?: string } | null;
    if (el && typeof el.value !== 'undefined' && el.value !== value) el.value = value ?? '';
  }, [value, mode]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const toggleManual = () => {
    setForceManual((prev) => {
      const next = !prev;
      if (next) {
        // Clean up widget if it was mounted
        if (widgetSlotRef.current) widgetSlotRef.current.innerHTML = '';
        autocompleteRef.current = null;
      }
      return next;
    });
  };

  const isLoading = mode === 'loading';
  const showNewWidget = mode === 'new_widget' && !forceManual;
  const showLegacyInput = (mode === 'legacy' && !forceManual) || mode === 'manual' || forceManual;
  const inputClassName = `pl-10 pr-10 h-11 border-2 border-gray-200 focus:border-primary rounded-xl text-sm cursor-text ${className}`;

  return (
    <div ref={containerRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary z-10 pointer-events-none" />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin z-10 pointer-events-none" />
        )}

        {/* Toggle to switch to manual entry */}
        {!isLoading && mode !== 'manual' && (
          <button
            type="button"
            onClick={toggleManual}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
            title={forceManual ? 'Use autocomplete' : 'Enter address manually'}
          >
            <Keyboard className={`w-4 h-4 ${forceManual ? 'text-primary' : 'text-gray-400'}`} />
          </button>
        )}

        {showNewWidget && (
          <div
            ref={widgetSlotRef}
            className={`min-h-[2.75rem] rounded-xl border-2 border-gray-200 [&_gmp-place-autocomplete]:!h-11 [&_gmp-place-autocomplete]:!rounded-xl [&_gmp-place-autocomplete]:!border-0 [&_gmp-place-autocomplete]:!pl-10 [&_gmp-place-autocomplete]:!text-sm ${className}`}
            style={{ ['--gmp-place-autocomplete-border' as string]: 'none' }}
          />
        )}

        {showLegacyInput && (
          <Input
            id={id}
            type="text"
            value={value}
            onChange={handleChange}
            placeholder={forceManual ? 'Type the full address…' : placeholder}
            className={inputClassName}
            autoComplete="off"
            required={required}
          />
        )}
      </div>

      {/* Subtle hint when in manual mode */}
      {(forceManual || mode === 'manual') && (
        <p className="text-[10px] text-gray-400 mt-0.5 ml-1">
          {mode === 'manual' ? 'Autocomplete unavailable — type the address manually' : 'Manual entry — click the keyboard icon to switch back'}
        </p>
      )}
    </div>
  );
}
