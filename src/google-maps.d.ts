/** Minimal type declarations for Google Maps Places Autocomplete */
declare namespace google.maps {
  namespace places {
    class Autocomplete {
      constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
      addListener(event: string, handler: () => void): void;
      getPlace(): PlaceResult;
    }

    interface AutocompleteOptions {
      types?: string[];
      componentRestrictions?: { country: string };
      fields?: string[];
    }

    interface PlaceResult {
      formatted_address?: string;
      place_id?: string;
      geometry?: {
        location?: {
          lat(): number;
          lng(): number;
        };
      };
    }
  }
}

interface Window {
  google?: typeof google;
}
