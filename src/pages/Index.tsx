import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Home, MessageSquare, Calendar, FolderKanban, Mail, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen">
      {/* Navigation - Floating Glass */}
      <nav className="sticky top-8 z-50 mx-6 md:mx-8">
        <div className="container mx-auto backdrop-blur-2xl rounded-3xl px-8 py-4 transition-all duration-500 hover:scale-[1.01]" 
             style={{ 
               background: 'rgba(15, 23, 42, 0.85)',
               border: '1px solid rgba(255, 255, 255, 0.15)',
               boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
               color: 'hsl(160 70% 92%)'
             }}>
          <div className="flex items-center justify-between">
            <a href="/" className="flex items-center transform hover:scale-105 transition-transform duration-300">
              <img src="/logo-inverted.svg" alt="InboxAgent.ai" className="h-10 w-auto" />
            </a>
            <div className="hidden items-center gap-10 md:flex">
              <a href="#features" className="text-sm font-semibold opacity-85 hover:opacity-100 transition-all duration-200">Features</a>
              <a href="#pricing" className="text-sm font-semibold opacity-85 hover:opacity-100 transition-all duration-200">Pricing</a>
              <a href="#faq" className="text-sm font-semibold opacity-85 hover:opacity-100 transition-all duration-200">FAQ</a>
            </div>
            <Button onClick={() => navigate('/beta')} size="sm" className="shadow-2xl shadow-primary/30 hover:scale-110 hover:shadow-primary/40 transition-all duration-300">
              Get early access
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Dark with Gradient */}
      <section className="relative overflow-hidden min-h-screen flex items-center" style={{ 
        background: 'linear-gradient(135deg, hsl(222 60% 8%) 0%, hsl(222 64% 11%) 60%, hsl(222 60% 8%) 100%)',
        color: 'hsl(160 70% 92%)'
      }}>
        {/* Halo Effect */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(1200px 500px at 20% -10%, rgba(16,185,129,.25), transparent 60%), radial-gradient(900px 500px at 80% -20%, rgba(59,130,246,.18), transparent 65%)'
        }} />
        
        <div className="container mx-auto px-4 py-32 md:py-40 relative z-10">
          <div className="grid items-center gap-12 md:grid-cols-[1.2fr_0.8fr] md:gap-16">
            <div className="space-y-8">
              {/* Chip Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm hover:scale-105 transition-transform duration-300"
                   style={{ 
                     background: 'rgba(16,185,129,.15)', 
                     color: 'hsl(160 84% 39%)',
                     border: '1px solid rgba(16,185,129,.3)',
                     boxShadow: '0 4px 12px rgba(16,185,129,.15)'
                   }}>
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-bold">Realtors save 1–2 hours/day</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight">
                Your AI Email Coordinator{" "}
                <span className="text-primary">for Real Estate</span>
              </h1>
              <p className="text-xl md:text-2xl leading-relaxed" style={{ color: 'hsl(215 20% 75%)' }}>
                Group messages by property, draft replies in your tone, and turn showing requests into calendar events — focus on closings, not inbox chaos.
              </p>
              <ul className="space-y-4" style={{ color: 'hsl(215 30% 85%)' }}>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-lg">Deal threads by address (e.g., "1420 Maple Ave")</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-lg">One-click "Add to Calendar" for showings & inspections</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="mt-1 h-6 w-6 flex-shrink-0 text-primary" />
                  <span className="text-lg">Daily digest of offers, deadlines, and follow-ups</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4 mb-5">
                <Button 
                  onClick={() => navigate('/beta')} 
                  size="lg" 
                  className="shadow-2xl shadow-primary/30 hover:scale-110 hover:shadow-primary/40 transition-all duration-300 text-base px-8 py-6 h-auto font-semibold"
                >
                  Start free beta
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="hover:scale-105 transition-all duration-300 text-base px-8 py-6 h-auto font-semibold backdrop-blur-sm"
                  style={{ 
                    color: 'hsl(160 70% 92%)', 
                    borderColor: 'rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.05)'
                  }}
                >
                  See how it works
                </Button>
              </div>
              
              {/* Logos */}
              <div className="flex items-center gap-5 flex-wrap opacity-80" style={{ color: 'hsl(215 20% 75%)' }}>
                <span className="text-sm font-medium">Works with:</span>
                <div className="px-4 py-2 rounded-lg backdrop-blur-sm text-white text-sm font-semibold transition-all duration-300 hover:scale-105" style={{ background: 'rgba(31, 41, 55, 0.7)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Gmail</div>
                <div className="px-4 py-2 rounded-lg backdrop-blur-sm text-white text-sm font-semibold transition-all duration-300 hover:scale-105" style={{ background: 'rgba(30, 58, 138, 0.7)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Outlook</div>
                <div className="px-4 py-2 rounded-lg backdrop-blur-sm text-white text-sm font-semibold transition-all duration-300 hover:scale-105" style={{ background: 'rgba(15, 118, 110, 0.7)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>Google Calendar</div>
              </div>
            </div>
            
            {/* Glass Card - Floating with Dramatic Elevation */}
            <div className="rounded-[2rem] p-8 backdrop-blur-2xl hover:scale-[1.03] hover:rotate-1 transition-all duration-700" style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.03))',
              border: '2px solid rgba(255,255,255,.2)',
              boxShadow: '0 50px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08), inset 0 1px 1px rgba(255,255,255,.15)'
            }}>
              <div className="flex h-72 items-center justify-center rounded-3xl overflow-hidden" style={{
                background: 'linear-gradient(135deg, hsl(222 60% 12%), hsl(210 60% 16%))',
                color: 'hsl(215 20% 75%)',
                boxShadow: 'inset 0 4px 8px rgba(0,0,0,.4)'
              }}>
                <div className="text-center px-4">
                  <p className="mb-3 text-xs uppercase tracking-widest opacity-60 font-semibold">UI Preview</p>
                  <h3 className="mb-2 text-xl font-bold">Deal Thread: 1420 Maple Ave</h3>
                  <p className="text-base opacity-90">Deal Heat: 82 · Showing Fri 2:00 PM</p>
                </div>
              </div>
              
              {/* Stats - Floating with Strong Shadows */}
              <div className="grid grid-cols-3 gap-5 mt-8">
                <div className="rounded-3xl p-5 text-center backdrop-blur-md hover:scale-110 hover:-translate-y-2 transition-all duration-500 cursor-pointer" style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid rgba(255,255,255,.12)',
                  boxShadow: '0 20px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)',
                  color: 'hsl(160 70% 92%)'
                }}>
                  <div className="text-3xl font-black">1–2 hrs</div>
                  <div className="text-xs opacity-80 mt-2 font-medium">Saved daily</div>
                </div>
                <div className="rounded-3xl p-5 text-center backdrop-blur-md hover:scale-110 hover:-translate-y-2 transition-all duration-500 cursor-pointer" style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid rgba(255,255,255,.12)',
                  boxShadow: '0 20px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)',
                  color: 'hsl(160 70% 92%)'
                }}>
                  <div className="text-3xl font-black">80%+</div>
                  <div className="text-xs opacity-80 mt-2 font-medium">Auto-grouped</div>
                </div>
                <div className="rounded-3xl p-5 text-center backdrop-blur-md hover:scale-110 hover:-translate-y-2 transition-all duration-500 cursor-pointer" style={{ 
                  background: 'rgba(15, 23, 42, 0.8)', 
                  border: '1px solid rgba(255,255,255,.12)',
                  boxShadow: '0 20px 40px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.05)',
                  color: 'hsl(160 70% 92%)'
                }}>
                  <div className="text-3xl font-black">90 sec</div>
                  <div className="text-xs opacity-80 mt-2 font-medium">To inbox zero</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32" style={{ background: 'hsl(210 20% 98%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="mb-4 text-5xl font-black text-foreground">Everything a busy agent needs</h2>
            <p className="text-muted-foreground text-xl">Built specifically for real estate workflows.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Smart Inbox Prioritization</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Offers, deadlines, and time-sensitive requests surface first.</p>
            </Card>
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <MessageSquare className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">AI Response Composer</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Drafts in your tone; review and send in seconds.</p>
            </Card>
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <Calendar className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Auto-Schedule Detection</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Detects dates & times; creates calendar suggestions instantly.</p>
            </Card>
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <FolderKanban className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Deal Thread Grouping</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Organizes conversations by property and stakeholders.</p>
            </Card>
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <Home className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Daily Digest</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Morning brief: today's showings, pending offers, follow-ups.</p>
            </Card>
            <Card className="border-0 bg-card p-8 hover:scale-105 hover:-translate-y-3 transition-all duration-500 cursor-pointer group" style={{
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
              borderRadius: '1.5rem'
            }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300" style={{ background: 'hsl(160 100% 96%)', color: 'hsl(160 80% 20%)' }}>
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-card-foreground">Smart Attachments Panel</h3>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">Contracts and disclosures surfaced per deal thread.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="mb-4 text-5xl font-black text-foreground">Loved by top-performing agents</h2>
          </div>
          <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
            <Card className="border-0 bg-card p-10 hover:scale-105 hover:-translate-y-4 transition-all duration-500 cursor-pointer" style={{
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
              borderRadius: '1.5rem'
            }}>
              <p className="text-foreground mb-6 text-xl leading-relaxed font-medium">"I hit inbox zero by 9:30 AM for the first time in years."</p>
              <p className="text-base font-bold text-muted-foreground">— Ava, Keller Williams</p>
            </Card>
            <Card className="border-0 bg-card p-10 hover:scale-105 hover:-translate-y-4 transition-all duration-500 cursor-pointer" style={{
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
              borderRadius: '1.5rem'
            }}>
              <p className="text-foreground mb-6 text-xl leading-relaxed font-medium">"Threads by address is a game changer. My team actually replies faster."</p>
              <p className="text-base font-bold text-muted-foreground">— Marco, Compass</p>
            </Card>
            <Card className="border-0 bg-card p-10 hover:scale-105 hover:-translate-y-4 transition-all duration-500 cursor-pointer" style={{
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
              borderRadius: '1.5rem'
            }}>
              <p className="text-foreground mb-6 text-xl leading-relaxed font-medium">"Saved ~9 hours my first week. It just knows what matters."</p>
              <p className="text-base font-bold text-muted-foreground">— Dana, Coldwell Banker</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32" style={{ background: 'hsl(210 20% 98%)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 max-w-3xl mx-auto">
            <h2 className="mb-4 text-5xl font-black text-foreground">Simple pricing for serious agents</h2>
            <p className="text-muted-foreground text-xl">Start free. Upgrade when it's saving you hours.</p>
          </div>
          <div className="grid gap-10 md:grid-cols-3 max-w-6xl mx-auto">
            <Card className="border-0 bg-card p-10 hover:scale-105 hover:-translate-y-4 transition-all duration-500 cursor-pointer" style={{
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
              borderRadius: '1.75rem'
            }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-card-foreground mb-2">Starter</h3>
              </div>
              <div className="mb-10">
                <span className="text-5xl font-black text-foreground">$8.99</span>
              </div>
              <ul className="mb-10 space-y-4 text-base text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Up to 500 emails/month
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Smart sorting + daily digest
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  1 account (Gmail or Outlook)
                </li>
              </ul>
              <Button variant="outline" className="w-full h-12 text-base font-semibold" onClick={() => navigate('/beta')}>
                Try free
              </Button>
            </Card>

            <Card className="relative bg-card p-10 hover:scale-110 hover:-translate-y-6 transition-all duration-500 cursor-pointer" style={{ 
              border: '3px solid hsl(160 70% 85%)', 
              boxShadow: '0 35px 80px rgba(16,185,129,.3)',
              borderRadius: '1.75rem'
            }}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-card-foreground">Pro</h3>
                <span className="text-sm font-bold px-4 py-2 rounded-full" style={{ 
                  background: 'hsl(160 100% 92%)', 
                  color: 'hsl(160 80% 20%)' 
                }}>
                  Most popular
                </span>
              </div>
              <div className="mb-10">
                <span className="text-5xl font-black text-foreground">$39.99</span>
              </div>
              <ul className="mb-10 space-y-4 text-base text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Unlimited email processing
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  AI reply drafts + calendar
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Priority analytics & deal threads
                </li>
              </ul>
              <Button className="w-full h-12 text-base font-semibold shadow-2xl shadow-primary/30 hover:shadow-primary/40" onClick={() => navigate('/beta')}>
                Start Pro
              </Button>
            </Card>

            <Card className="border-0 bg-card p-10 hover:scale-105 hover:-translate-y-4 transition-all duration-500 cursor-pointer" style={{
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.15)',
              borderRadius: '1.75rem'
            }}>
              <div className="mb-8">
                <h3 className="text-2xl font-black text-card-foreground mb-2">Team</h3>
              </div>
              <div className="mb-10">
                <span className="text-5xl font-black text-foreground">$49.99</span>
                <span className="text-lg text-muted-foreground font-semibold">/user</span>
              </div>
              <ul className="mb-10 space-y-4 text-base text-muted-foreground">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Shared inbox & roles
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  Team analytics dashboard
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 flex-shrink-0 text-primary mt-0.5" />
                  CRM-style contact enrichment
                </li>
              </ul>
              <Button variant="outline" className="w-full h-12 text-base font-semibold" onClick={() => navigate('/beta')}>
                Contact sales
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Apple Style Floating */}
      <section className="py-32 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(222 60% 8%) 0%, hsl(222 64% 11%) 60%, hsl(222 60% 8%) 100%)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(1000px 400px at 50% 50%, rgba(16,185,129,.15), transparent 70%)'
        }} />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] p-12 md:p-16 backdrop-blur-xl hover:scale-[1.02] transition-all duration-700" style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.03))',
            border: '2px solid rgba(255,255,255,.2)',
            boxShadow: '0 50px 100px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.08)'
          }}>
            <div className="text-center">
              <h2 className="mb-4 text-4xl md:text-5xl font-black" style={{ color: 'hsl(160 70% 92%)' }}>
                Turn inbox chaos into closings.
              </h2>
              <p className="mb-8 text-xl" style={{ color: 'hsl(215 20% 75%)' }}>
                Join the beta and see the difference this week.
              </p>
              <Button 
                size="lg" 
                onClick={() => navigate('/beta')}
                className="shadow-2xl shadow-primary/30 hover:scale-110 hover:shadow-primary/40 transition-all duration-300 text-lg px-10 py-7 h-auto font-bold"
                style={{ background: 'white', color: 'hsl(160 80% 20%)' }}
              >
                Get early access
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Apple Style */}
      <footer className="py-12" style={{ background: 'hsl(210 20% 98%)' }}>
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto rounded-3xl p-8 backdrop-blur-sm" style={{
            background: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
          }}>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img src="/logo.svg" alt="InboxAgent.ai" className="h-8 w-auto opacity-80" />
                <span className="text-sm text-muted-foreground">© {currentYear} InboxAgent.ai</span>
              </div>
              <div className="flex gap-6 text-sm font-medium">
                <a href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy</a>
                <a href="/security" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Security</a>
                <a href="/terms" className="text-muted-foreground hover:text-foreground transition-colors duration-200">Terms</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* FAQ anchor */}
      <div id="faq" />
    </div>
  );
};

export default Index;
