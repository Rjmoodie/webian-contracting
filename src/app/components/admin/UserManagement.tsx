import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Input } from '@/app/components/ui/input';
import { Users, Shield, Camera, Briefcase, Search, UserCog } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  createdAt: string;
}

interface UserManagementProps {
  serverUrl: string;
  accessToken: string;
  currentUser: any;
}

export default function UserManagement({ serverUrl, accessToken, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${serverUrl}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`${serverUrl}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        toast.success('User role updated successfully');
        fetchUsers();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4 text-[#755f52]" />;
      case 'manager':
        return <UserCog className="w-4 h-4 text-[#755f52]" />;
      case 'talent':
        return <Camera className="w-4 h-4 text-[#B0DD16]" />;
      case 'client':
        return <Briefcase className="w-4 h-4 text-[#B0DD16]" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-[#755f52] text-white';
      case 'manager':
        return 'bg-[#8b7263] text-white';
      case 'talent':
        return 'bg-[#B0DD16] text-white';
      case 'client':
        return 'bg-[#c9a882] text-white';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Filter users based on search and role filter
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // Only admins can change roles
  const canEditRoles = currentUser.role === 'admin';

  return (
    <div>
      <Card className="border-0 shadow-premium card-premium">
        <CardHeader className="gradient-premium text-white">
          <CardTitle className="flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-48 min-h-[44px] sm:h-12 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="client">Clients</SelectItem>
                <SelectItem value="talent">Talents</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Permission Notice */}
          {!canEditRoles && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Only admins can modify user roles. You can view users but cannot make changes.
              </p>
            </div>
          )}

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B0DD16]"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl">
              <div className="w-20 h-20 bg-[#755f52] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-[#755f52]" />
              </div>
              <h3 className="text-lg font-semibold text-[#755f52] mb-2">No Users Found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="card-premium border-2 border-gray-200 rounded-xl p-4 sm:p-5 hover:border-[#B0DD16] transition-all duration-300 bg-white hover-lift"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="font-bold text-base sm:text-lg text-[#755f52] tracking-tight">{user.name}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(user.role)}
                            {getRoleLabel(user.role)}
                          </div>
                        </Badge>
                        {user.id === currentUser.id && (
                          <Badge className="bg-blue-100 text-blue-800">You</Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">{user.email}</p>
                      {user.company && (
                        <p className="text-xs text-gray-500 mt-1">Company: {user.company}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Role Selector */}
                    {canEditRoles && user.id !== currentUser.id && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 font-medium">Change role:</span>
                        <Select 
                          value={user.role}
                          onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                        >
                          <SelectTrigger className="w-full sm:w-48 border-2 border-gray-200 focus:border-[#B0DD16] rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="client">
                              <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-[#B0DD16]" />
                                <span>Client</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="talent">
                              <div className="flex items-center gap-2">
                                <Camera className="w-4 h-4 text-[#B0DD16]" />
                                <span>Talent</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="manager">
                              <div className="flex items-center gap-2">
                                <UserCog className="w-4 h-4 text-[#755f52]" />
                                <span>Manager</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="admin">
                              <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#755f52]" />
                                <span>Admin</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Cannot edit own role */}
                    {user.id === currentUser.id && (
                      <div className="text-sm text-gray-500 italic">
                        Cannot change your own role
                      </div>
                    )}

                    {/* View only for managers */}
                    {!canEditRoles && (
                      <div className="text-sm text-gray-500 italic">
                        View only
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl card-premium">
                <div className="text-xl sm:text-2xl font-bold text-[#755f52] tracking-tight">
                  {users.filter(u => u.role === 'client').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Clients</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl card-premium">
                <div className="text-xl sm:text-2xl font-bold text-[#755f52] tracking-tight">
                  {users.filter(u => u.role === 'talent').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Talents</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl card-premium">
                <div className="text-xl sm:text-2xl font-bold text-[#755f52] tracking-tight">
                  {users.filter(u => u.role === 'manager').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Managers</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-[#f5f1eb] to-[#ebe4d8] rounded-xl card-premium">
                <div className="text-xl sm:text-2xl font-bold text-[#755f52] tracking-tight">
                  {users.filter(u => u.role === 'admin').length}
                </div>
                <div className="text-xs text-gray-600 mt-1">Admins</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
