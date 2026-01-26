import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Users } from 'lucide-react';

interface TalentManagementProps {
  serverUrl: string;
  accessToken: string;
}

export default function TalentManagement({ serverUrl, accessToken }: TalentManagementProps) {
  const [talents, setTalents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTalents();
  }, []);

  const fetchTalents = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/talents`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTalents(data.talents || []);
      }
    } catch (error) {
      console.error('Error fetching talents:', error);
    } finally {
      setLoading(false);
    }
  };

  const approvedTalents = talents.filter(t => t.status === 'approved');
  const filteredTalents = approvedTalents.filter(t =>
    t.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
    t.coverageParishes?.some((p: string) => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">Vetted Talent Pool</h2>
          <p className="text-sm sm:text-base text-gray-600">Private crew roster - visible only to ECJ coordinators</p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Input
          placeholder="Search by skills or parish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-[#7fa589] tracking-tight">{approvedTalents.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Total Approved</div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600 tracking-tight">
              {approvedTalents.filter(t => t.skills?.includes('photo')).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Photographers</div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600 tracking-tight">
              {approvedTalents.filter(t => t.skills?.includes('video')).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Videographers</div>
          </CardContent>
        </Card>
        <Card className="card-premium">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600 tracking-tight">
              {approvedTalents.filter(t => t.skills?.includes('audio')).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Audio Techs</div>
          </CardContent>
        </Card>
      </div>

      {/* Talent List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredTalents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No approved talent found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredTalents.map((talent) => (
            <Card key={talent.id} className="card-premium hover-lift">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base sm:text-lg tracking-tight">Talent #{talent.userId?.substring(0, 8)}</CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{talent.experience}</p>
                  </div>
                  {talent.tier && (
                    <Badge className="gradient-premium text-white shadow-premium">
                      {talent.tier}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">Skills</p>
                  <div className="flex gap-2">
                    {talent.skills?.map((skill: string) => (
                      <Badge key={skill} variant="outline">
                        {skill === 'photo' ? '📷 Photo' : skill === 'video' ? '🎥 Video' : '🎵 Audio'}
                      </Badge>
                    ))}
                  </div>
                </div>

                {talent.coverageParishes && talent.coverageParishes.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">Coverage</p>
                    <div className="flex flex-wrap gap-1">
                      {talent.coverageParishes.slice(0, 5).map((parish: string) => (
                        <span key={parish} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {parish}
                        </span>
                      ))}
                      {talent.coverageParishes.length > 5 && (
                        <span className="text-xs text-gray-500">+{talent.coverageParishes.length - 5} more</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t text-xs text-gray-500">
                  Reliability Score: {talent.reliabilityScore || 100}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
