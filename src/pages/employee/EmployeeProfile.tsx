import { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Bell, 
  Settings, 
  Camera, 
  Shield, 
  Award,
  Clock,
  Target,
  BookOpen,
  Star,
  TrendingUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const EmployeeProfile = () => {
  const { user, name } = useSelector((state: RootState) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [notifications, setNotifications] = useState({
    taskUpdates: true,
    emailAlerts: true,
    deadlineReminders: true,
    teamMessages: false
  });

  const displayName = name || user?.fullName || user?.email || 'Employee';
  const userInitials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

  // Mock data for employee performance
  const performanceMetrics = {
    tasksCompleted: 87,
    onTimeDelivery: 94,
    clientSatisfaction: 4.8,
    skillLevel: 85,
    hoursLogged: 160,
    targetHours: 170
  };

  const skills = [
    { name: 'GST Filing', level: 90, category: 'Tax' },
    { name: 'ITR Preparation', level: 85, category: 'Tax' },
    { name: 'Audit Support', level: 78, category: 'Audit' },
    { name: 'ROC Compliance', level: 82, category: 'Compliance' },
    { name: 'TDS Returns', level: 88, category: 'Tax' }
  ];

  const achievements = [
    { title: 'Efficiency Expert', description: 'Completed 95% of tasks on time this month', icon: Target, color: 'text-green-600' },
    { title: 'Client Favorite', description: 'Received 5-star ratings from 3 clients', icon: Star, color: 'text-yellow-600' },
    { title: 'Tax Specialist', description: 'Completed advanced GST certification', icon: Award, color: 'text-blue-600' },
    { title: 'Team Player', description: 'Helped 5 colleagues with complex tasks', icon: CheckCircle, color: 'text-purple-600' }
  ];

  return (
    <div className="flex-1 space-y-6 p-6 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Profile
          </h2>
          <p className="text-muted-foreground">
            Manage your profile, settings, and view your performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant={isEditing ? "default" : "outline"} 
            onClick={() => setIsEditing(!isEditing)}
          >
            <Settings className="mr-2 h-4 w-4" />
            {isEditing ? 'Save Changes' : 'Edit Profile'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} />
                  <AvatarFallback className="text-lg">{userInitials}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button variant="outline" size="sm">
                    <Camera className="mr-2 h-4 w-4" />
                    Change Photo
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input 
                    id="fullName" 
                    value={displayName} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user?.email || ''} 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    value="+91 00000 00000" 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input 
                    id="department" 
                    value="Tax Advisory" 
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Tell us about yourself..."
                  value="Experienced CA professional specializing in tax advisory and compliance. Passionate about helping clients navigate complex tax regulations."
                  disabled={!isEditing}
                  className={!isEditing ? "bg-gray-50" : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Expertise */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-green-600" />
                Skills & Expertise
              </CardTitle>
              <CardDescription>
                Your professional skills and competency levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium">{skill.name}</span>
                        <Badge variant="outline" className="ml-2 text-xs">
                          {skill.category}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">{skill.level}%</span>
                    </div>
                    <Progress value={skill.level} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Performance Metrics */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Your monthly performance overview
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tasks Completed</span>
                  <span className="font-semibold">{performanceMetrics.tasksCompleted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">On-Time Delivery</span>
                  <span className="font-semibold text-green-600">{performanceMetrics.onTimeDelivery}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Client Rating</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{performanceMetrics.clientSatisfaction}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monthly Hours</span>
                    <span className="font-semibold">{performanceMetrics.hoursLogged}/{performanceMetrics.targetHours}</span>
                  </div>
                  <Progress 
                    value={(performanceMetrics.hoursLogged / performanceMetrics.targetHours) * 100} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                Recent Achievements
              </CardTitle>
              <CardDescription>
                Your accomplishments and recognitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <achievement.icon className={`h-5 w-5 ${achievement.color} mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Notifications
              </CardTitle>
              <CardDescription>
                Manage your notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="task-updates" className="text-sm">Task Updates</Label>
                  <Switch 
                    id="task-updates"
                    checked={notifications.taskUpdates}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, taskUpdates: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-alerts" className="text-sm">Email Alerts</Label>
                  <Switch 
                    id="email-alerts"
                    checked={notifications.emailAlerts}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, emailAlerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="deadline-reminders" className="text-sm">Deadline Reminders</Label>
                  <Switch 
                    id="deadline-reminders"
                    checked={notifications.deadlineReminders}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, deadlineReminders: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="team-messages" className="text-sm">Team Messages</Label>
                  <Switch 
                    id="team-messages"
                    checked={notifications.teamMessages}
                    onCheckedChange={(checked) => 
                      setNotifications(prev => ({ ...prev, teamMessages: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeProfile;