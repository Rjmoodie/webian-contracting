import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { User, Briefcase, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getFreshToken } from '/utils/supabase/client';
import { api } from '/utils/supabase/api';
import Navigation from '../Navigation';

const PARISHES = [
  'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
  'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
  'Manchester', 'Clarendon', 'St. Catherine',
];

interface TalentDashboardProps {
  user: any;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function TalentDashboard({ user, accessToken, onLogout, onNavigate }: TalentDashboardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience: '',
    gear: '',
    portfolioLinks: '',
    coverageParishes: [] as string[],
    bio: '',
  });

  // Helper: get a valid token
  const getToken = async () => await getFreshToken() || accessToken;

  useEffect(() => {
    fetchProfile();
    fetchAssignments();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${api('projects')}/talent/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        console.warn('[TalentDashboard] Backend returned 401');
        setBackendAvailable(false);
        return;
      }
      setBackendAvailable(true);

      if (response.ok) {
        const data = await response.json();
        setProfile(data.talent);
        
        // Pre-fill form if profile exists
        if (data.talent) {
          setFormData({
            skills: data.talent.skills || [],
            experience: data.talent.experience || '',
            gear: data.talent.gear || '',
            portfolioLinks: Array.isArray(data.talent.portfolioLinks) ? data.talent.portfolioLinks.join('\n') : '',
            coverageParishes: data.talent.coverageParishes || [],
            bio: data.talent.bio || '',
          });
        } else {
          // No profile yet, enable edit mode
          setEditMode(true);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${api('projects')}/assignments/my`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.status === 401) {
        setBackendAvailable(false);
        return;
      }
      setBackendAvailable(true);

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${api('projects')}/talent/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          skills: formData.skills,
          experience: formData.experience,
          gear: formData.gear,
          portfolioLinks: formData.portfolioLinks.split('\n').filter(l => l.trim()),
          coverageParishes: formData.coverageParishes,
          bio: formData.bio,
        }),
      });

      if (response.ok) {
        toast.success(profile ? 'Profile updated!' : 'Application submitted!');
        setEditMode(false);
        fetchProfile();
      } else {
        toast.error('Failed to save profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleRespondToAssignment = async (assignmentId: string, status: 'accepted' | 'declined') => {
    try {
      const response = await fetch(`${api('projects')}/assignments/${assignmentId}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast.success(`Assignment ${status}!`);
        fetchAssignments();
      } else {
        toast.error('Failed to respond to assignment');
      }
    } catch (error) {
      console.error('Error responding to assignment:', error);
      toast.error('Failed to respond to assignment');
    }
  };

  const toggleSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const toggleParish = (parish: string) => {
    setFormData(prev => ({
      ...prev,
      coverageParishes: prev.coverageParishes.includes(parish)
        ? prev.coverageParishes.filter(p => p !== parish)
        : [...prev.coverageParishes, parish]
    }));
  };

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Header */}
      <Navigation
        user={user}
        onNavigate={onNavigate}
        onLogout={onLogout}
        variant="dashboard"
        portalLabel="Talent Portal"
        showBrowseServices={false}
        showNavLinks={false}
      />
      {/* Spacer for fixed header (taller on dashboard for larger logo) */}
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Backend connectivity warning */}
        {!backendAvailable && (
          <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-3">
            <span className="shrink-0 text-lg">&#9888;</span>
            <span>
              <strong>Backend unavailable</strong> — The server is not responding to authenticated requests.
              Your data may not be up to date. The Edge Function may need to be redeployed.
              <button onClick={() => { setBackendAvailable(true); fetchProfile(); fetchAssignments(); }} className="ml-2 underline font-semibold">Retry</button>
            </span>
          </div>
        )}
        {/* Welcome */}
        <Card className="mb-6 sm:mb-8 bg-primary text-white border-0 shadow-lg overflow-hidden">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex-1 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold mb-1">Talent Portal</h1>
                  <p className="text-sm text-white/90">You’re part of WCI’s vetted crew. Clients book WCI services; your profile is internal only.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content — Assignments first on mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Assignments — first for quick access */}
          <div className="lg:order-2 order-1">
            <Card className="card-premium h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Assignments
                  {assignments.length > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-primary/20 text-secondary">
                      {assignments.filter((a: any) => a.status === 'pending').length} new
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 flex-1">
                {assignments.length === 0 ? (
                  <div className="text-center py-8 sm:py-10">
                    <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <Briefcase className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">No assignments yet</p>
                    <p className="text-xs text-gray-500">Complete your profile to receive assignments.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border border-gray-200 rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">Request #{assignment.requestId?.split('-').pop() || '—'}</span>
                          <Badge className={
                            assignment.status === 'accepted' || assignment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'declined' ? 'bg-gray-100 text-gray-700' :
                            'bg-amber-100 text-amber-800'
                          }>
                            {assignment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Role: {assignment.role}</p>
                        {assignment.status === 'pending' && (
                          <div className="flex gap-2 pt-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-primary hover:opacity-90 text-white font-semibold"
                              onClick={() => handleRespondToAssignment(assignment.id, 'accepted')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1.5 shrink-0" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 border-gray-300"
                              onClick={() => handleRespondToAssignment(assignment.id, 'declined')}
                            >
                              <XCircle className="w-4 h-4 mr-1.5 shrink-0" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile/Application */}
          <div className="lg:col-span-2 lg:order-1 order-2">
            <Card className="card-premium">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">{profile ? 'Your Profile' : 'Create Your Profile'}</CardTitle>
                <p className="text-sm text-gray-500 font-normal mt-1">Services, parishes, and portfolio</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {editMode ? (
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-3 block">Services Offered</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="photo"
                            checked={formData.skills.includes('photo')}
                            onCheckedChange={() => toggleSkill('photo')}
                          />
                          <Label htmlFor="photo">Photography</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="video"
                            checked={formData.skills.includes('video')}
                            onCheckedChange={() => toggleSkill('video')}
                          />
                          <Label htmlFor="video">Videography</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="audio"
                            checked={formData.skills.includes('audio')}
                            onCheckedChange={() => toggleSkill('audio')}
                          />
                          <Label htmlFor="audio">Sound / Audio</Label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        placeholder="e.g., 5 years"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="bio">Professional Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell clients about your experience and style..."
                        rows={4}
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gear">Equipment & Gear</Label>
                      <Textarea
                        id="gear"
                        placeholder="List your cameras, lenses, audio equipment, etc."
                        rows={3}
                        value={formData.gear}
                        onChange={(e) => setFormData({ ...formData, gear: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="portfolio">Portfolio Links (one per line)</Label>
                      <Textarea
                        id="portfolio"
                        placeholder="https://instagram.com/yourwork&#10;https://yourwebsite.com"
                        rows={3}
                        value={formData.portfolioLinks}
                        onChange={(e) => setFormData({ ...formData, portfolioLinks: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label className="mb-3 block">Coverage Parishes</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PARISHES.map(parish => (
                          <div key={parish} className="flex items-center space-x-2">
                            <Checkbox
                              id={parish}
                              checked={formData.coverageParishes.includes(parish)}
                              onCheckedChange={() => toggleParish(parish)}
                            />
                            <Label htmlFor={parish} className="text-sm">{parish}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleSaveProfile} className="flex-1 bg-primary text-white hover:opacity-90">
                        {profile ? 'Save Changes' : 'Submit Application'}
                      </Button>
                      {profile && (
                        <Button variant="outline" onClick={() => {
                          setEditMode(false);
                          fetchProfile();
                        }}>
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile ? (
                      <>
                        <div>
                          <h3 className="font-semibold mb-2">Services</h3>
                          <div className="flex gap-2">
                            {profile.skills?.map((skill: string) => (
                              <Badge key={skill} variant="secondary">
                                {skill === 'photo' ? 'Photography' : skill === 'video' ? 'Videography' : 'Audio'}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {profile.bio && (
                          <div>
                            <h3 className="font-semibold mb-2">Bio</h3>
                            <p className="text-gray-700">{profile.bio}</p>
                          </div>
                        )}

                        {profile.coverageParishes && (
                          <div>
                            <h3 className="font-semibold mb-2">Coverage Areas</h3>
                            <div className="flex flex-wrap gap-2">
                              {profile.coverageParishes.map((parish: string) => (
                                <span key={parish} className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                  {parish}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Create your profile to start receiving assignments</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}