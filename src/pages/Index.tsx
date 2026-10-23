import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Monitor, LayoutDashboard, ChefHat, ArrowRight, Coffee, CreditCard, Users, Sparkles, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  { icon: QrCode, title: 'QR Code Ordering', description: 'Customers scan, browse, and pay — all from their phone.', link: '/menu?table=1', color: 'from-primary to-primary/60' },
  { icon: Monitor, title: 'Staff POS System', description: 'Fast billing, table management, and order tracking.', link: '/login', color: 'from-accent to-accent/60' },
  { icon: ChefHat, title: 'Kitchen Display', description: 'Real-time order relay. Never miss an order again.', link: '/login', color: 'from-success to-success/60' },
  { icon: LayoutDashboard, title: 'Admin Dashboard', description: 'Menu, analytics, staff — complete business oversight.', link: '/login', color: 'from-info to-info/60' },
  { icon: Users, title: 'Staff Portal', description: 'Attendance tracking, leave management, and shift overview.', link: '/login', color: 'from-purple-500 to-purple-500/60' },
];

const stats = [
  { value: '3x', label: 'Faster Service', icon: Zap },
  { value: '100%', label: 'Digital Payments', icon: CreditCard },
  { value: '50+', label: 'Tables Managed', icon: Users },
  { value: '99.9%', label: 'Uptime', icon: Shield },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background dark">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Coffee className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">CaféFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
              <Link to="/menu?table=1">Customer Menu</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground glow-primary">
              <Link to="/login"><Sparkles className="h-4 w-4 mr-2" /> Staff Login</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden gradient-mesh">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-32">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl mx-auto text-center">
            <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-8">
              <Sparkles className="h-4 w-4" /> Next-Gen Cafe Management
            </motion.span>
            <h1 className="text-6xl md:text-8xl font-heading font-bold text-foreground mb-6 leading-[0.9] tracking-tight">
              Brew <span className="text-gradient">Smarter</span>,<br />
              Serve <span className="text-gradient">Faster</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed font-body">
              An integrated ordering, billing, and kitchen management system built for modern cafes.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-base px-8 py-7 glow-primary rounded-2xl font-body font-semibold">
                <Link to="/menu?table=1"><QrCode className="mr-2 h-5 w-5" /> Try Customer Menu</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-border text-foreground hover:bg-muted text-base px-8 py-7 rounded-2xl font-body">
                <Link to="/login">Staff Portal <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
          </motion.div>

          {/* 3D Floating Cards */}
          <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }} className="mt-20 max-w-4xl mx-auto">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {['☕', '🍕', '🥗', '🎂', '🍹', '🧃'].map((emoji, i) => (
                <motion.div key={i} animate={{ y: [0, -10, 0] }} transition={{ delay: i * 0.3, duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="card-3d">
                  <div className="card-3d-inner bg-card/50 backdrop-blur-lg border border-border/50 rounded-2xl p-6 text-center cafe-shadow-lg">
                    <span className="text-5xl block mb-2">{emoji}</span>
                    <span className="text-xs text-muted-foreground font-body">
                      {['Coffee', 'Food', 'Salads', 'Desserts', 'Cocktails', 'Juices'][i]}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="text-center">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-4xl font-heading font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground font-body mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Five Powerful Modules</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-body">Working together to run your cafe seamlessly.</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Link to={f.link}
                  className="block group p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 cafe-shadow hover:cafe-shadow-lg hover:glow-primary">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-2">{f.title}</h3>
                  <p className="text-muted-foreground font-body mb-4">{f.description}</p>
                  <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all font-body">
                    Explore <ArrowRight className="h-4 w-4 ml-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center font-body text-sm text-muted-foreground">
          <p>© 2026 CaféFlow — Next-Gen Cafe Management System</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
