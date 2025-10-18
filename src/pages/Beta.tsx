import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Mail, Users, Zap, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Beta = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profession: '',
    email_volume: '',
    platform_used: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('beta_signups')
        .insert([formData]);

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: 'Application submitted!',
        description: "We'll review your application and send you an invite soon.",
      });
    } catch (error: any) {
      toast({
        title: 'Error submitting application',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">You're on the list!</CardTitle>
            <CardDescription className="text-lg">
              We'll review your application and send you an invite within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              As a beta pioneer, you'll get:
            </p>
            <ul className="text-left space-y-2">
              <li className="flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                <span>60-day free Pro plan ($49 value)</span>
              </li>
              <li className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Award className="h-3 w-3" />
                  Beta Pioneer
                </Badge>
                <span>Exclusive badge</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <span>Direct line to the founders</span>
              </li>
            </ul>
            <Button onClick={() => navigate('/')} className="w-full mt-6">
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">
              Limited to 50 Users
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join the InboxAgent.ai Closed Beta
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Help shape the future of AI-powered email management. Get early access and 60 days of Pro for free.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Early Access</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Be among the first to experience AI that actually understands your inbox
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">Beta Pioneer Badge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Exclusive recognition as a founding member of our community
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mb-2" />
                <CardTitle className="text-lg">60 Days Free Pro</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Full access to all premium features worth $49/month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Beta Application</CardTitle>
              <CardDescription>
                We're looking for busy professionals handling 100+ emails per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profession">Profession *</Label>
                  <Select
                    required
                    value={formData.profession}
                    onValueChange={(value) => setFormData({ ...formData, profession: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your profession" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real_estate">Real Estate Agent</SelectItem>
                      <SelectItem value="sales">Sales Representative</SelectItem>
                      <SelectItem value="founder">Startup Founder</SelectItem>
                      <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
                      <SelectItem value="manager">Manager/Executive</SelectItem>
                      <SelectItem value="consultant">Consultant</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_volume">Daily Email Volume *</Label>
                  <Select
                    required
                    value={formData.email_volume}
                    onValueChange={(value) => setFormData({ ...formData, email_volume: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your daily email volume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="50-100">50-100 emails/day</SelectItem>
                      <SelectItem value="100-200">100-200 emails/day</SelectItem>
                      <SelectItem value="200-500">200-500 emails/day</SelectItem>
                      <SelectItem value="500+">500+ emails/day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="platform">Primary Email Platform *</Label>
                  <Select
                    required
                    value={formData.platform_used}
                    onValueChange={(value) => setFormData({ ...formData, platform_used: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your email platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gmail">Gmail</SelectItem>
                      <SelectItem value="outlook">Outlook</SelectItem>
                      <SelectItem value="both">Both Gmail & Outlook</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Submitting...' : 'Apply for Beta Access'}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By applying, you agree to provide honest feedback and actively participate in the beta program
                </p>
              </form>
            </CardContent>
          </Card>

          {/* What to Expect */}
          <Card className="max-w-2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle className="text-lg">What to Expect</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-3">
                <div className="text-primary font-semibold">Week 1:</div>
                <div className="text-sm text-muted-foreground">
                  Onboarding, initial testing, and frequent feedback sessions
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-primary font-semibold">Week 2:</div>
                <div className="text-sm text-muted-foreground">
                  Bug fixes, feature refinements, and final feedback survey
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-primary font-semibold">Time Commitment:</div>
                <div className="text-sm text-muted-foreground">
                  Daily use + 10 minutes/week for surveys and feedback
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Beta;
