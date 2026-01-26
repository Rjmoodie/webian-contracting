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
import Navigation from '../Navigation';

interface TalentDashboardProps {
  user: any;
  serverUrl: string;
  accessToken: string;
  onLogout: () => void;
  onNavigate: (page: string) => void;
}

export default function TalentDashboard({ user, serverUrl, accessToken, onLogout, onNavigate }: TalentDashboardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    skills: [] as string[],
    experience: '',
    gear: '',
    portfolioLinks: '',
    coverageParishes: [] as string[],
    bio: '',
  });

  const parishes = [
    'Kingston', 'St. Andrew', 'St. Thomas', 'Portland', 'St. Mary', 'St. Ann',
    'Trelawny', 'St. James', 'Hanover', 'Westmoreland', 'St. Elizabeth',
    'Manchester', 'Clarendon', 'St. Catherine'
  ];

  useEffect(() => {
    fetchProfile();
    fetchAssignments();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${serverUrl}/talent/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

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
      const response = await fetch(`${serverUrl}/assignments/my`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

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
      const response = await fetch(`${serverUrl}/talent/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
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
      const response = await fetch(`${serverUrl}/assignments/${assignmentId}/respond`, {
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
      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <Card className="mb-8 bg-gradient-to-r from-[#7fa589] to-[#6d8f75] text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome to the Crew!</h2>
                <p className="opacity-90">
                  You are part of ECJ's private vetted crew. Your profile is visible only to ECJ coordinators.
                </p>
                <p className="opacity-75 text-sm mt-2">
                  ⚠️ Your identity is never shown to clients - they hire ECJ services, not individuals.
                </p>
              </div>
              <User className="w-12 h-12" />
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile/Application */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{profile ? 'Your Profile' : 'Create Your Profile'}</CardTitle>
              </CardHeader>
              <CardContent>
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
                      <div className="grid grid-cols-2 gap-2">
                        {parishes.map(parish => (
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
                      <Button onClick={handleSaveProfile} className="flex-1">
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

          {/* Assignments Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 text-sm">No assignments yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium">Request #{assignment.requestId.split(':')[1]}</span>
                          <Badge className={
                            assignment.status === 'accepted' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'declined' ? 'bg-red-100 text-red-800' :
                            assignment.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {assignment.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">Role: {assignment.role}</p>
                        
                        {assignment.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={() => handleRespondToAssignment(assignment.id, 'accepted')}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => handleRespondToAssignment(assignment.id, 'declined')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
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
        </div>
      </div>
    </div>
  );
}