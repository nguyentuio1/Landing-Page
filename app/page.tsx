'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Inter, Space_Grotesk } from "next/font/google";
import { subscribeToEmailCount, getEmailCount } from '../lib/firestore';

// Real-time email counter hook using Firestore
const useRealTimeEmailCount = () => {
  const [count, setCount] = useState(1247);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get initial count
    getEmailCount().then(initialCount => {
      setCount(initialCount);
      setIsConnected(true);
    }).catch(error => {
      console.error('Error getting initial count:', error);
      setCount(1247); // Fallback count
      setIsConnected(false);
    });

    // Subscribe to real-time updates
    const unsubscribe = subscribeToEmailCount((newCount) => {
      setCount(newCount);
      setIsConnected(true);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  return { count, isConnected };
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

const EmailSignup = () => {
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
      // Import the Firestore function
      const { addEmailToFirestore } = await import('../lib/firestore');
      
      // Add email to Firestore
      const result = await addEmailToFirestore(formState.email);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add email');
      }
      
      setFormState(prev => ({ 
        ...prev, 
        isSubmitting: false, 
        isSubmitted: true,
        email: ''
      }));
      
      // Firestore real-time listeners will automatically update the count
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
  const [splineLoaded, setSplineLoaded] = useState(false)
  const { count: emailCount, isConnected } = useRealTimeEmailCount();

  const scrollToEmailSignup = () => {
    const emailSection = document.querySelector('#email-signup');
    if (emailSection) {
      emailSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setIsLoaded(true)
    // Delay Spline loading to prioritize critical content
    const timer = setTimeout(() => {
      setSplineLoaded(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className={`min-h-screen text-primary overflow-hidden ${inter.variable} ${spaceGrotesk.variable}`}>
      {/* Optimized Spline 3D Background with Lazy Loading */}
      <div className="fixed inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        {splineLoaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <spline-viewer 
              url="https://prod.spline.design/Z4Ub-8CJ48AxGork/scene.splinecode"
              loading-anim-type="spinner-small-dark"
              style={{
                width: '100%',
                height: '100%',
                background: 'transparent'
              }}
            />
          </motion.div>
        )}
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
          onClick={scrollToEmailSignup}
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
              Anper
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
              onClick={scrollToEmailSignup}
              className="bg-button-primary text-white px-12 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:scale-105"
            >
              Start Creating for Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToEmailSignup}
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

      {/* Examples/Showcase Section */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-gray-50/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-8 font-space-grotesk leading-tight tracking-tight">
              See the{' '}
              <span className="gradient-text">
                Magic in Action
              </span>
            </h2>
            <p className="text-xl text-secondary/80 max-w-4xl mx-auto font-inter font-medium leading-relaxed">
              From simple images to stunning 3D models - witness the power of AI transformation that's revolutionizing game development.
            </p>
          </motion.div>

          {/* Image to 3D Example - Full Width */}
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-morphism p-8 rounded-2xl border-subtle mb-16"
          >
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-3 text-accent font-space-grotesk">🖼️ Image to 3D Model Transformation</h3>
              <p className="text-lg text-secondary/80 font-inter">See how our AI transforms a simple image into a stunning 3D model</p>
            </div>
            
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-6xl mx-auto">
              {/* Input Image */}
              <div className="flex-1 max-w-md">
                <div className="text-sm font-bold text-gray-600 mb-3 text-center font-space-grotesk">BEFORE: Your Image</div>
                <div className="relative group">
                  <img 
                    src="/image-model/51S-uHIx5sL.jpg" 
                    alt="Input image example" 
                    className="w-full aspect-square object-cover rounded-lg border-2 border-gray-300 shadow-lg transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg"></div>
                </div>
                <p className="text-sm text-gray-600 text-center mt-2 font-inter">Original uploaded image</p>
              </div>
              
              {/* Arrow */}
              <div className="flex flex-col items-center">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl text-accent mb-2"
                >
                  ✨
                </motion.div>
                <div className="text-2xl text-accent font-bold">AI Magic</div>
                <motion.div 
                  animate={{ x: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl text-accent mt-2"
                >
                  →
                </motion.div>
              </div>
              
              {/* Output 3D Model Video */}
              <div className="flex-1 max-w-md">
                <div className="text-sm font-bold text-gray-600 mb-3 text-center font-space-grotesk">AFTER: 3D Model</div>
                <div className="relative group">
                  <video 
                    src="/video-model/Hunyuan3D-2.0 - a Hugging Face Space by tencent - Google Chrome 2025-08-18 23-26-38 (online-video-cutter.com).mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full aspect-square object-cover rounded-lg border-2 border-accent/30 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                    LIVE 3D
                  </div>
                </div>
                <p className="text-sm text-accent font-bold text-center mt-2 font-inter">Interactive 3D model ready for Roblox</p>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold text-accent font-space-grotesk">15s</div>
                <div className="text-sm text-secondary/80 font-inter">Processing Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent font-space-grotesk">100%</div>
                <div className="text-sm text-secondary/80 font-inter">Roblox Compatible</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent font-space-grotesk">Studio</div>
                <div className="text-sm text-secondary/80 font-inter">Quality Output</div>
              </div>
            </div>
          </motion.div>

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl mb-4">⚡</div>
              <h4 className="font-bold text-lg mb-2 font-space-grotesk">Lightning Fast</h4>
              <p className="text-secondary/80 text-sm font-inter">Transform images to 3D models in under 60 seconds</p>
            </motion.div>
            
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl mb-4">🎯</div>
              <h4 className="font-bold text-lg mb-2 font-space-grotesk">Roblox Ready</h4>
              <p className="text-secondary/80 text-sm font-inter">Perfect optimization for Roblox Studio import</p>
            </motion.div>
            
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="text-3xl mb-4">✨</div>
              <h4 className="font-bold text-lg mb-2 font-space-grotesk">Studio Quality</h4>
              <p className="text-secondary/80 text-sm font-inter">Professional-grade results every time</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Email Signup Section */}
      <section id="email-signup" className="relative z-10 py-20 px-6">
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
          <EmailSignup />
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
              <div className="text-sm text-secondary/80 font-inter font-medium">
                <AnimatedCounter count={emailCount} /> developers already joined
                {isConnected && (
                  <div className="items-center ml-2 inline-flex">
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