'use client'

import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Inter, Space_Grotesk } from "next/font/google";

// Real-time email counter hook
const useRealTimeEmailCount = () => {
  const [count, setCount] = useState(1247);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connectWebSocket = () => {
    try {
      // Connect to your local WebSocket server
      const ws = new WebSocket('ws://localhost:8081');
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        wsRef.current = ws;
        
        // Send initial count request
        ws.send(JSON.stringify({ type: 'get_count' }));
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'count_update') {
            setCount(data.count);
          }
        } catch (e) {
          console.log('Failed to parse WebSocket message:', e);
        }
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        wsRef.current = null;
        
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      setIsConnected(false);
    }
  };

  const broadcastEmailAdded = (email?: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'email_added',
        email: email,
        timestamp: Date.now() 
      }));
    }
    // Don't update locally - let the server broadcast the real count
  };

  useEffect(() => {
    connectWebSocket();
    
    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Fallback polling mechanism - only fetch real count, no auto-increment
  useEffect(() => {
    if (!isConnected) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch('http://localhost:8080/api/count');
          if (response.ok) {
            const data = await response.json();
            setCount(data.count);
          }
        } catch (error) {
          console.log('Polling failed, keeping current count');
        }
      }, 10000); // Poll every 10 seconds when disconnected
      
      return () => clearInterval(pollInterval);
    }
  }, [isConnected]);

  return { count, broadcastEmailAdded, isConnected };
};

interface EmailFormState {
  email: string;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string;
}

interface CounterProps {
  count: number;
}

const AnimatedCounter = ({ count }: CounterProps) => {
  const [displayCount, setDisplayCount] = useState(count);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (displayCount !== count) {
      setIsAnimating(true);
      
      // Animate to new count over 800ms
      const diff = count - displayCount;
      const duration = 800;
      const steps = Math.min(Math.abs(diff), 30); // Max 30 steps
      const stepValue = diff / steps;
      const stepDuration = duration / steps;
      
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        if (currentStep >= steps) {
          setDisplayCount(count);
          setIsAnimating(false);
          clearInterval(timer);
        } else {
          setDisplayCount(prev => Math.round(prev + stepValue));
        }
      }, stepDuration);
      
      return () => clearInterval(timer);
    }
  }, [count, displayCount]);

  return (
    <motion.div 
      className="inline-flex items-center"
      animate={{ scale: isAnimating ? 1.05 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        key={Math.floor(displayCount / 1000)} // Re-animate on thousands change
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-2xl font-bold text-accent font-space-grotesk tracking-tight"
      >
        {displayCount.toLocaleString()}
      </motion.span>
      {isAnimating && (
        <motion.div
          initial={{ scale: 0, rotate: 0 }}
          animate={{ scale: 1, rotate: 360 }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.6 }}
          className="ml-2 w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"
        />
      )}
    </motion.div>
  );
};

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"], 
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"], 
  variable: "--font-space-grotesk",
});

const EmailSignup = ({ onEmailAdded }: { onEmailAdded: (email: string) => void }) => {
  const [formState, setFormState] = useState<EmailFormState>({
    email: '',
    isSubmitting: false,
    isSubmitted: false,
    error: ''
  });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(formState.email)) {
      setFormState(prev => ({ ...prev, error: 'Please enter a valid email address' }));
      return;
    }

    setFormState(prev => ({ ...prev, isSubmitting: true, error: '' }));

    try {
      // Send email to your backend API
      const response = await fetch('http://localhost:8080/api/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formState.email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add email');
      }
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        isSubmitted: true,
        email: ''
      }));
      
      // No need to call onEmailAdded - the server already broadcasts the count update
    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        error: 'Something went wrong. Please try again.' 
      }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState(prev => ({ 
      ...prev, 
      email: e.target.value, 
      error: '',
      isSubmitted: false 
    }));
  };

  if (formState.isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-morphism p-8 rounded-2xl text-center border-subtle max-w-md mx-auto"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
          className="text-4xl mb-4"
        >
          ✅
        </motion.div>
        <h3 className="text-xl font-semibold mb-3 text-success font-space-grotesk">🎉 Welcome to the future!</h3>
        <p className="text-secondary/80 font-inter font-medium leading-relaxed">You&apos;re in! Get ready for exclusive beta access and complimentary credits to jumpstart your creative journey.</p>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-morphism p-8 rounded-2xl border-subtle max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold mb-3 text-accent font-space-grotesk">🚀 Secure Your Early Access</h3>
        <p className="text-secondary/80 font-inter font-medium leading-relaxed">Join our exclusive beta community and receive complimentary credits when we officially launch!</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={formState.email}
            onChange={handleEmailChange}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 rounded-lg border border-subtle bg-white/70 backdrop-blur-sm text-primary placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all font-inter"
            disabled={formState.isSubmitting}
          />
          {formState.error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-error text-sm mt-2 font-inter"
            >
              {formState.error}
            </motion.p>
          )}
        </div>
        
        <motion.button
          type="submit"
          disabled={formState.isSubmitting || !formState.email}
          whileHover={{ scale: formState.isSubmitting ? 1 : 1.02 }}
          whileTap={{ scale: formState.isSubmitting ? 1 : 0.98 }}
          className="w-full bg-button-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 font-inter hover:scale-105"
        >
          {formState.isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Joining...
            </span>
          ) : (
            'Secure My Beta Access'
          )}
        </motion.button>
      </div>
      
      <p className="text-xs text-secondary/70 text-center mt-4 font-inter">
        Zero spam promise. Unsubscribe anytime with one click.
      </p>
    </motion.form>
  );
};

const GradientOrb = ({ className, delay = 0 }: { className?: string; delay?: number }) => {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  )
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const { count: emailCount, broadcastEmailAdded, isConnected } = useRealTimeEmailCount();

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleEmailAdded = (email: string) => {
    broadcastEmailAdded(email);
  };

  return (
    <main className={`min-h-screen text-primary overflow-hidden ${inter.variable} ${spaceGrotesk.variable}`}>
      {/* Spline 3D Background */}
      <div className="fixed inset-0 z-0">
        <spline-viewer url="https://prod.spline.design/Z4Ub-8CJ48AxGork/scene.splinecode" />
      </div>

      {/* Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative z-50 flex justify-between items-center p-6 lg:p-8"
      >
        <div className="text-2xl font-bold gradient-text font-space-grotesk">
          ANPER
        </div>
        <div className="hidden md:flex space-x-8">
          <a href="#features" className="hover:text-accent transition-colors font-medium hover-glow">Features</a>
          <a href="#how-it-works" className="hover:text-accent transition-colors font-medium hover-glow">How it Works</a>
          <a href="#pricing" className="hover:text-accent transition-colors font-medium hover-glow">Pricing</a>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-button-primary text-white px-6 py-2 rounded-lg transition-all font-medium hover:scale-105"
        >
          Get Started
        </motion.button>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          <motion.h1
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-space-grotesk text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-[0.9] tracking-tight"
          >
            Bring Your{' '}
            <span className="text-accent">
              Ideas to Life
            </span>
            <br />
            with AI-Powered{' '}
            <span className="gradient-text">
              3D Magic
            </span>
            <br />
            for{' '}
            <span className="gradient-text">
              Roblox
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-xl md:text-2xl text-secondary/80 mb-12 max-w-4xl mx-auto leading-relaxed font-inter font-medium"
          >
            Transform any image into stunning, game-ready 3D models that will elevate your Roblox creations to professional levels. 
            No complex 3D modeling skills required – simply upload, convert, and watch your imagination come to life!
          </motion.p>

          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(107, 114, 128, 0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-button-primary text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:scale-105"
            >
              Start Creating for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="glass-morphism px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:bg-white/90 text-primary border border-accent/30 hover:border-accent/50"
            >
              Watch Demo
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Floating 3D Models Preview */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-20 relative"
        >
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="glass-morphism p-8 rounded-2xl border-subtle"
          >
            <div className="w-32 h-32 bg-accent rounded-xl flex items-center justify-center text-2xl filter grayscale opacity-80">
              🎮
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8 font-space-grotesk leading-tight tracking-tight">
              Why Thousands of{' '}
              <span className="gradient-text">
                Developers Choose Us
              </span>
            </h2>
            <p className="text-xl text-secondary/80 max-w-4xl mx-auto font-inter font-medium leading-relaxed">
              Join the revolution! Our AI doesn&apos;t just convert images – it creates game-changing 3D assets 
              that will make your Roblox creations stand out and captivate every player.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Instant Results",
                description: "Transform ideas into stunning 3D models in under 60 seconds. Skip the wait, embrace instant creative power.",
              },
              {
                icon: "🎯",
                title: "Roblox Perfect",
                description: "Every model is meticulously optimized for Roblox – guaranteed seamless integration into your games.",
              },
              {
                icon: "🔧",
                title: "Plug & Play",
                description: "Effortlessly import directly into Roblox Studio. Zero technical setup, zero complicated workflows.",
              },
              {
                icon: "🎨",
                title: "Studio Quality",
                description: "Studio-quality results that rival premium 3D modeling services – delivered in seconds, not weeks.",
              },
              {
                icon: "💼",
                title: "Monetize Freely",
                description: "Complete commercial licensing included. Scale your Roblox empire with absolute legal confidence.",
              },
              {
                icon: "🔄",
                title: "Scale Like a Pro",
                description: "Batch-convert dozens of models simultaneously. Built for ambitious developers creating the next viral sensation."
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="glass-morphism p-8 rounded-2xl text-center hover:bg-white/20 transition-all duration-300 border-subtle"
              >
                <div className="text-4xl mb-4 filter grayscale opacity-80">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-4 text-accent font-space-grotesk">{feature.title}</h3>
                <p className="text-secondary/80 leading-relaxed font-inter font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent to-gray-100/20">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8 font-space-grotesk leading-tight tracking-tight">
              Simple{' '}
              <span className="gradient-text">
                3-Step Process
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Upload Image",
                description: "Simply drag and drop your image or paste any URL. Works with any photo – zero special requirements.",
                icon: "📤"
              },
              {
                step: "02", 
                title: "AI Processing",
                description: "Our advanced AI analyzes every detail with precision, crafting your perfect, game-ready 3D model.",
                icon: "🤖"
              },
              {
                step: "03",
                title: "Download & Use",
                description: "Download your model instantly and watch your Roblox game transform into something extraordinary!",
                icon: "⬇️"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="glass-morphism w-20 h-20 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 border-subtle filter grayscale opacity-80"
                >
                  {item.icon}
                </motion.div>
                <div className="text-gray-600 text-sm font-bold mb-2 font-space-grotesk">STEP {item.step}</div>
                <h3 className="text-2xl font-bold mb-4 text-accent font-space-grotesk">{item.title}</h3>
                <p className="text-secondary/80 leading-relaxed font-inter font-medium">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Email Signup Section */}
      <section className="relative z-10 py-20 px-6">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 font-space-grotesk">
            Ready to Revolutionize{' '}
            <span className="gradient-text">
              Your Roblox Game?
            </span>
          </h2>
          <p className="text-xl text-secondary mb-12 font-inter">
            Don&apos;t get left behind! Join thousands of smart developers who are already transforming their games with AI.
          </p>
        </motion.div>
        
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <EmailSignup onEmailAdded={handleEmailAdded} />
        </motion.div>
        
        {/* Social Proof Counter */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <div className="glass-morphism inline-flex items-center px-6 py-3 rounded-full border-subtle">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full border-2 border-white"></div>
                <div className="w-8 h-8 bg-gradient-to-r from-gray-600 to-gray-800 rounded-full border-2 border-white"></div>
              </div>
              <div className="text-sm text-secondary/80 font-inter font-medium">
                <AnimatedCounter count={emailCount} /> developers already joined
                {isConnected && (
                  <div className="flex items-center ml-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-subtle">
        <div className="max-w-7xl mx-auto text-center">
          <div className="text-2xl font-bold gradient-text mb-4 font-space-grotesk">ANPER</div>
          <p className="text-secondary mb-6 font-inter">Transform your imagination into reality with AI-powered 3D conversion.</p>
          <div className="flex justify-center space-x-8 text-secondary">
            <a href="#" className="hover:text-accent transition-colors font-medium hover-glow">Privacy Policy</a>
            <a href="#" className="hover:text-accent transition-colors font-medium hover-glow">Terms of Service</a>
            <a href="#" className="hover:text-accent transition-colors font-medium hover-glow">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  )
}