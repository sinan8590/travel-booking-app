import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MapPin, 
  MessageCircle, 
  Wind, 
  Music, 
  Armchair, 
  ShieldCheck, 
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Instagram,
  Facebook,
  Twitter,
  Plus,
  Trash2,
  LogIn,
  LogOut,
  Loader2,
  Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth, 
  db, 
  storage,
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  getDocFromCache,
  getDocFromServer,
  setDoc
} from './firebase';

const OWNER_EMAIL = "muhammedsinanu8590@gmail.com";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

interface AppSettings {
  phoneNumber: string;
  instagramId: string;
  owners: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  phoneNumber: "9207479305",
  instagramId: "sinan_____U",
  owners: []
};

const AdminSettings = ({ settings, onUpdate }: { settings: AppSettings, onUpdate: (newSettings: AppSettings) => Promise<void> }) => {
  const [phone, setPhone] = useState(settings.phoneNumber);
  const [insta, setInsta] = useState(settings.instagramId);
  const [ownersList, setOwnersList] = useState(settings.owners || []);
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [emailTestStatus, setEmailTestStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleTestEmail = async () => {
    setIsTestingEmail(true);
    setEmailTestStatus(null);
    try {
      const response = await fetch('/api/test-email', { method: 'POST' });
      const data = await response.json();
      if (response.ok) {
        setEmailTestStatus({ type: 'success', message: data.message });
      } else {
        setEmailTestStatus({ type: 'error', message: data.error + (data.details ? `: ${data.details}` : '') });
      }
    } catch (error: any) {
      setEmailTestStatus({ type: 'error', message: `Test failed: ${error.message}` });
    } finally {
      setIsTestingEmail(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate({ phoneNumber: phone, instagramId: insta, owners: ownersList });
    } finally {
      setIsSaving(false);
    }
  };

  const addOwner = () => {
    if (newOwnerEmail && !ownersList.includes(newOwnerEmail)) {
      setOwnersList([...ownersList, newOwnerEmail]);
      setNewOwnerEmail('');
    }
  };

  const removeOwner = (email: string) => {
    setOwnersList(ownersList.filter(e => e !== email));
  };

  return (
    <section className="py-12 px-6 bg-emerald-950/40 border-y border-gold-500/10">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-2xl font-serif font-bold mb-8 text-gold-500 flex items-center gap-2">
          <Sparkles size={24} /> Admin Settings
        </h3>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9207479305"
              />
            </div>
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-400 uppercase tracking-widest">Instagram ID</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                value={insta}
                onChange={(e) => setInsta(e.target.value)}
                placeholder="e.g. sinan_____U"
              />
            </div>
          </div>

          <div className="space-y-6">
            <label className="block text-sm font-medium text-gray-400 uppercase tracking-widest">Additional Owners</label>
            <div className="flex gap-2">
              <input 
                type="email" 
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                value={newOwnerEmail}
                onChange={(e) => setNewOwnerEmail(e.target.value)}
                placeholder="Enter Gmail address"
              />
              <button 
                onClick={addOwner}
                className="px-6 py-3 bg-emerald-900 text-gold-500 border border-gold-500/30 rounded-xl font-bold hover:bg-emerald-800 transition-all"
              >
                Add
              </button>
            </div>
            
            <div className="space-y-2">
              {ownersList.map(email => (
                <div key={email} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-gray-300 text-sm">{email}</span>
                  <button 
                    onClick={() => removeOwner(email)}
                    className="text-red-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {ownersList.length === 0 && (
                <p className="text-gray-600 text-xs italic">No additional owners added.</p>
              )}
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="mt-8 px-8 py-3 bg-gold-500 text-emerald-950 rounded-xl font-bold hover:bg-gold-600 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : 'Save Settings'}
        </button>

        <div className="mt-12 pt-8 border-t border-gold-500/10">
          <h4 className="text-lg font-serif font-bold mb-4 text-gold-500">Email Service Diagnostic</h4>
          <p className="text-gray-400 text-sm mb-6">
            Verify if your email credentials (EMAIL_USER and EMAIL_PASS) are correctly configured in the Secrets panel.
          </p>
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <button 
              onClick={handleTestEmail}
              disabled={isTestingEmail}
              className="px-6 py-3 bg-emerald-900 text-gold-500 border border-gold-500/30 rounded-xl font-bold hover:bg-emerald-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isTestingEmail ? <Loader2 className="animate-spin" size={20} /> : 'Test Email Connection'}
            </button>
            {emailTestStatus && (
              <div className={`p-3 rounded-xl text-sm font-medium whitespace-pre-line flex-1 ${emailTestStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                {emailTestStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Features', href: '#features' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-4 shadow-lg' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center border border-gold-500/30">
            <span className="text-gold-500 font-serif font-bold text-xl">GK</span>
          </div>
          <span className="text-white font-serif font-bold text-xl tracking-wider">GREEN KERALA</span>
        </motion.div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link, i) => (
            <motion.a
              key={link.name}
              href={link.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="text-sm font-medium text-gray-300 hover:text-gold-500 transition-colors uppercase tracking-widest"
            >
              {link.name}
            </motion.a>
          ))}
          <motion.a
            href="#contact"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-6 py-2 bg-emerald-900 text-gold-500 border border-gold-500/30 rounded-full text-sm font-bold hover:bg-emerald-800 transition-all"
          >
            BOOK NOW
          </motion.a>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-emerald-950 border-t border-white/10 overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg font-medium text-gray-300 hover:text-gold-500"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = ({ settings }: { settings: AppSettings }) => {
  return (
    <section id="home" className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Bus" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black"></div>
      </div>

      <div className="relative z-10 text-center px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-gold-500 font-medium tracking-[0.3em] uppercase text-sm mb-4 block">
            Luxury • Comfort • Premium Travel Experience
          </span>
          <h1 className="text-5xl md:text-8xl font-serif font-bold text-white mb-6 leading-tight">
            GREEN <span className="gold-gradient">KERALA</span>
          </h1>
          <p className="text-gray-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Experience the ultimate in luxury travel across the lush landscapes of Kerala. 
            Your journey deserves the finest comfort and professional service.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="#contact" 
              className="w-full sm:w-auto px-8 py-4 bg-emerald-900 text-gold-500 border border-gold-500/50 rounded-full font-bold text-lg hover:bg-emerald-800 transition-all shadow-2xl shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              Book Now <ChevronRight size={20} />
            </a>
            <a 
              href={`https://wa.me/91${settings.phoneNumber}?text=Hello%20Green%20Kerala%2C%20I%20would%20like%20to%20book%20a%20luxury%20travel%20vehicle.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 shadow-xl"
            >
              <MessageCircle size={20} /> WhatsApp
            </a>
            <a 
              href={`tel:${settings.phoneNumber}`} 
              className="w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-full font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2"
            >
              <Phone size={20} /> Call Now
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-gold-500/50"
      >
        <div className="w-6 h-10 border-2 border-gold-500/30 rounded-full flex justify-center p-1">
          <div className="w-1 h-2 bg-gold-500 rounded-full"></div>
        </div>
      </motion.div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-24 px-6 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="relative z-10 rounded-2xl overflow-hidden border border-white/10">
            <img 
              src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=1000" 
              alt="Kerala Landscape" 
              className="w-full aspect-[4/5] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-emerald-900/30 rounded-2xl -z-0 blur-2xl"></div>
          <div className="absolute top-1/2 -left-10 w-20 h-20 border-2 border-gold-500/20 rounded-full"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          <span className="text-gold-500 font-medium tracking-widest uppercase text-sm mb-4 block">Our Legacy</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Redefining Luxury <br /><span className="text-emerald-900 italic">Travel in Kerala</span></h2>
          <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
            <p>
              Green Kerala is more than just a transport service; it's a commitment to excellence. 
              We specialize in providing premium luxury travel experiences for tourists and groups 
              who value comfort, safety, and professionalism.
            </p>
            <p>
              Our fleet features state-of-the-art AC tourist buses equipped with modern amenities 
              to ensure your journey through God's Own Country is as beautiful as the destination itself.
            </p>
            <div className="grid grid-cols-2 gap-6 pt-6">
              <div>
                <h4 className="text-gold-500 font-serif text-3xl font-bold">100%</h4>
                <p className="text-sm uppercase tracking-tighter">Reliability</p>
              </div>
              <div>
                <h4 className="text-gold-500 font-serif text-3xl font-bold">Premium</h4>
                <p className="text-sm uppercase tracking-tighter">Comfort</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Features = () => {
  const features = [
    {
      icon: <Wind className="text-gold-500" size={32} />,
      title: "Fully Air Conditioned",
      desc: "Stay cool and refreshed throughout your journey with our advanced climate control systems."
    },
    {
      icon: <Music className="text-gold-500" size={32} />,
      title: "JBL Premium Sound",
      desc: "Experience immersive entertainment with our high-fidelity JBL audio systems."
    },
    {
      icon: <Armchair className="text-gold-500" size={32} />,
      title: "Comfortable Seating",
      desc: "Ergonomically designed push-back seats with ample legroom for a fatigue-free travel."
    },
    {
      icon: <Sparkles className="text-gold-500" size={32} />,
      title: "Clean & Maintained",
      desc: "We maintain the highest standards of hygiene and regular mechanical checkups."
    },
    {
      icon: <ShieldCheck className="text-gold-500" size={32} />,
      title: "Smooth & Safe Travel",
      desc: "Professional drivers and modern safety features for a worry-free experience."
    }
  ];

  return (
    <section id="features" className="py-24 px-6 bg-emerald-950/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold-500 font-medium tracking-widest uppercase text-sm mb-4 block">World Class Amenities</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold">Premium Features</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div className="mb-6 p-4 bg-emerald-900/50 rounded-xl inline-block group-hover:scale-110 transition-transform">
                {f.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-white">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Gallery = ({ isOwner }: { isOwner: boolean }) => {
  const [images, setImages] = useState<{id: string, url: string, storagePath?: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const imgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as {id: string, url: string, storagePath?: string}[];
      setImages(imgs);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gallery');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isOwner) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB.");
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadStep("Preparing upload...");
    
    // Create a timeout for the upload
    const timeoutId = setTimeout(() => {
      if (isUploading) {
        setIsUploading(false);
        setUploadStep(null);
        setUploadError("Upload timed out. This often happens if Firebase Storage is not enabled in the Firebase Console.");
      }
    }, 60000); // 60 seconds timeout

    try {
      const storagePath = `gallery/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const storageRef = ref(storage, storagePath);
      
      setUploadStep("Connecting to storage...");
      console.log("Attempting upload to:", storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Monitor progress
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadStep(`Uploading: ${Math.round(progress)}%`);
          console.log('Upload is ' + progress + '% done');
        }, 
        (error) => {
          clearTimeout(timeoutId);
          console.error("Upload Task Error:", error);
          const errInfo = handleFirestoreError(error, OperationType.WRITE, 'gallery_storage');
          setUploadError(errInfo.error);
          setUploadStep(null);
          setIsUploading(false);
          
          if (errInfo.error.includes('storage/unauthorized')) {
            alert("Storage access denied. Please ensure you have enabled 'Storage' in your Firebase Console.");
          } else if (errInfo.error.includes('storage/retry-limit-exceeded')) {
            alert("Upload failed: Network error. Please check your connection.");
          } else {
            alert(`Upload failed: ${errInfo.error}`);
          }
        }, 
        async () => {
          // Upload completed successfully
          clearTimeout(timeoutId);
          setUploadStep("Generating download link...");
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("Download URL:", downloadURL);

            setUploadStep("Saving to database...");
            await addDoc(collection(db, 'gallery'), {
              url: downloadURL,
              storagePath: storagePath,
              createdAt: serverTimestamp(),
              ownerId: auth.currentUser?.uid
            });
            
            console.log("Firestore document added successfully");
            setUploadStep("Upload complete!");
            setTimeout(() => {
              setUploadStep(null);
              setIsUploading(false);
            }, 2000);
            e.target.value = '';
          } catch (err) {
            console.error("Error finalizing upload:", err);
            setUploadError("Failed to save image info to database.");
            setIsUploading(false);
          }
        }
      );
    } catch (error) {
      clearTimeout(timeoutId);
      console.error("Gallery Upload Initiation Error:", error);
      const errInfo = handleFirestoreError(error, OperationType.WRITE, 'gallery_storage');
      setUploadError(errInfo.error);
      setUploadStep(null);
      setIsUploading(false);
      alert(`Upload failed to start: ${errInfo.error}`);
    }
  };

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl.trim()) return;
    setIsAdding(true);
    setUploadError(null);
    
    let finalUrl = newImageUrl.trim();
    
    // Optimization: Try to extract direct image URL from Google Image search links
    try {
      if (finalUrl.includes('google.com/imgres')) {
        const urlObj = new URL(finalUrl);
        const imgUrlParam = urlObj.searchParams.get('imgurl');
        if (imgUrlParam) {
          finalUrl = decodeURIComponent(imgUrlParam);
          console.log("Extracted direct image URL from Google link:", finalUrl);
        }
      }
    } catch (err) {
      console.warn("Failed to parse URL for extraction:", err);
    }

    try {
      await addDoc(collection(db, 'gallery'), {
        url: finalUrl,
        createdAt: serverTimestamp(),
        ownerId: auth.currentUser?.uid
      });
      setNewImageUrl('');
    } catch (error) {
      const errInfo = handleFirestoreError(error, OperationType.CREATE, 'gallery');
      setUploadError(`Failed to add image: ${errInfo.error}`);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteImage = async (id: string, storagePath?: string) => {
    setDeletingId(id);
    try {
      // Delete from Firestore first
      await deleteDoc(doc(db, 'gallery', id));
      
      // Delete from Storage if it exists
      if (storagePath) {
        try {
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef);
        } catch (storageErr) {
          console.warn("Storage deletion failed (might already be gone):", storageErr);
        }
      }
      setDeleteConfirmId(null);
    } catch (error) {
      const errInfo = handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
      setUploadError(`Failed to delete image: ${errInfo.error}`);
    } finally {
      setDeletingId(null);
    }
  };

  const defaultImages = [
    "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1562620644-65bb4d29458a?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1557223562-6c77ef16210f?auto=format&fit=crop&q=80&w=800",
    "https://images.unsplash.com/photo-1509744645300-a2098b1180bf?auto=format&fit=crop&q=80&w=800"
  ];

  const displayImages = images.length > 0 ? images : defaultImages.map((url, i) => ({ id: `default-${i}`, url }));

  return (
    <section id="gallery" className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <span className="text-gold-500 font-medium tracking-widest uppercase text-sm mb-4 block">Visual Journey</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold">Our Fleet Gallery</h2>
          </div>
          <p className="text-gray-400 max-w-md">
            Take a look at our premium vehicles and the beautiful journeys we've facilitated across Kerala.
          </p>
        </div>

        {isOwner && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 p-6 glass-card rounded-2xl border-gold-500/20"
          >
            <h3 className="text-xl font-serif font-bold mb-4 text-gold-500 flex items-center gap-2">
              <Plus size={20} /> Manage Gallery
            </h3>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* File Upload */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-400 uppercase tracking-widest">Upload from Phone Gallery</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="gallery-upload"
                    disabled={isUploading}
                  />
                  <label 
                    htmlFor="gallery-upload"
                    className={`w-full py-8 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-gold-500/50 transition-all ${isUploading ? 'bg-white/5 cursor-not-allowed' : 'hover:bg-white/5'}`}
                  >
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin text-gold-500" size={40} />
                        <span className="text-gold-500 font-bold animate-pulse">{uploadStep || "Uploading..."}</span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsUploading(false);
                            setUploadStep(null);
                          }}
                          className="mt-2 text-xs text-gray-500 hover:text-white underline"
                        >
                          Cancel Upload
                        </button>
                      </div>
                    ) : (
                      <>
                        <Plus className="text-gold-500" size={32} />
                        <span className="text-gray-400 font-medium">Click to select photo</span>
                        <span className="text-gray-600 text-xs">Max size: 5MB</span>
                      </>
                    )}
                  </label>
                </div>
                {uploadError && (
                  <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                    <p className="text-red-500 text-xs">Error: {uploadError}</p>
                    <button 
                      onClick={() => setUploadError(null)}
                      className="text-red-500 hover:text-red-400 text-xs font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* URL Upload */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="block text-sm font-medium text-gray-400 uppercase tracking-widest">Add via Image URL</label>
                  <span className="text-[10px] text-gray-500 italic">Note: Use direct links ending in .jpg, .png, etc.</span>
                </div>
                <form onSubmit={handleAddImage} className="flex flex-col gap-4">
                  <input 
                    type="url" 
                    placeholder="https://example.com/image.jpg"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <button 
                    type="submit"
                    disabled={isAdding}
                    className="w-full py-4 bg-gold-500 text-emerald-950 rounded-xl font-bold hover:bg-gold-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? <Loader2 className="animate-spin" size={20} /> : 'Add via URL'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-gold-500" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayImages.map((img, i) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative aspect-video rounded-2xl overflow-hidden group border border-white/5 shadow-2xl"
              >
                <img 
                  src={img.url} 
                  alt={`Gallery ${i}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800";
                    console.warn(`Image failed to load: ${img.url}`);
                    setBrokenImages(prev => new Set(prev).add(img.id));
                  }}
                />
                {isOwner && brokenImages.has(img.id) && (
                  <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-red-500 text-white text-[10px] font-bold rounded-full shadow-lg flex items-center gap-1">
                    <X size={12} /> Broken Link
                  </div>
                )}
                <div className="absolute inset-0 bg-emerald-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                  {isOwner && !img.id.startsWith('default') ? (
                    <div className="flex flex-col items-center gap-2">
                      {deleteConfirmId === img.id ? (
                        <div className="flex gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteImage(img.id, img.storagePath);
                            }}
                            disabled={deletingId === img.id}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition-all flex items-center gap-1"
                          >
                            {deletingId === img.id ? <Loader2 className="animate-spin" size={14} /> : 'Confirm'}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-4 py-2 bg-white/20 text-white rounded-lg text-xs font-bold hover:bg-white/30 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(img.id);
                          }}
                          className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl hover:bg-red-600 hover:scale-110 transition-all active:scale-95"
                          title="Delete Image"
                        >
                          <Trash2 size={28} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gold-500 flex items-center justify-center text-emerald-950 shadow-xl">
                      <ChevronRight size={28} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const ServiceArea = () => {
  return (
    <section className="py-24 px-6 bg-emerald-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-black/20 skew-x-12 translate-x-1/4"></div>
      <div className="max-w-7xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6">Service Area</h2>
          <p className="text-emerald-100 text-xl mb-8 leading-relaxed">
            We provide premium travel services across the entire state of Kerala and offer outstation availability to neighboring states.
          </p>
          <ul className="grid grid-cols-2 gap-4 text-white font-medium">
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> All Over Kerala</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> Outstation Trips</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> Airport Transfers</li>
            <li className="flex items-center gap-2"><div className="w-2 h-2 bg-gold-500 rounded-full"></div> Group Tours</li>
          </ul>
        </div>
        <div className="flex-1 glass-card p-8 rounded-3xl border-white/20">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <MapPin className="text-gold-500" />
            </div>
            <div>
              <h4 className="font-bold text-white">Base Location</h4>
              <p className="text-emerald-100">Areekode, Malappuram, Kerala</p>
            </div>
          </div>
          <div className="w-full h-64 bg-black/40 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <iframe 
              width="100%" 
              height="100%" 
              frameBorder="0" 
              style={{ border: 0 }}
              src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Areekode,Malappuram,Kerala"
              allowFullScreen
              title="Green Kerala Base Location"
              className="grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
            ></iframe>
            {/* Fallback if no API key is provided - using a simpler embed that doesn't strictly require a key for basic view */}
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3914.123456789!2d76.0!3d11.0!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ba64f8c8c8c8c8c%3A0x8c8c8c8c8c8c8c8c!2sAreekode%2C%20Kerala!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'none' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
            {/* Real implementation using standard embed URL which is more reliable without a key */}
            <iframe
              src="https://maps.google.com/maps?q=Areekode,Malappuram,Kerala&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={true}
              loading="lazy"
              title="Green Kerala Location"
              className="grayscale contrast-125 opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-700"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = ({ settings }: { settings: AppSettings }) => {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    pickup: '',
    destination: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Use Nominatim for free reverse geocoding
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await response.json();
          if (data.display_name) {
            setFormData(prev => ({ ...prev, pickup: data.display_name }));
          } else {
            setFormData(prev => ({ ...prev, pickup: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
          }
        } catch (error) {
          console.error('Error reverse geocoding:', error);
          setFormData(prev => ({ ...prev, pickup: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` }));
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location. Please check your permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch('/api/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error(`Server returned non-JSON response (${response.status})`);
      }

      if (response.ok) {
        setSubmitStatus({ type: 'success', message: `Booking request sent successfully to ${OWNER_EMAIL}!` });
        setFormData({ name: '', date: '', pickup: '', destination: '' });
      } else {
        const errorMessage = data.error || 'Failed to send request. Please try again.';
        const helpMessage = data.help ? `\n\nHelp: ${data.help}` : '';
        
        // If it's the Gmail 535 error, we can add a more helpful UI element or link
        if (data.details && data.details.includes('535-5.7.8')) {
          setSubmitStatus({ 
            type: 'error', 
            message: `${errorMessage}${helpMessage}\n\nClick here to generate an App Password: https://myaccount.google.com/apppasswords` 
          });
        } else {
          setSubmitStatus({ type: 'error', message: errorMessage + helpMessage });
        }
        console.error('Booking error response:', data);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setSubmitStatus({ 
        type: 'error', 
        message: `Booking failed: ${error.message}. Please check your Vercel logs and environment variables.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-24 px-6 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div>
            <span className="text-gold-500 font-medium tracking-widest uppercase text-sm mb-4 block">Get in Touch</span>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-8">Book Your <br /><span className="gold-gradient">Premium Journey</span></h2>
            
            <div className="space-y-8 mb-12">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-emerald-900/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gold-500/20">
                  <Phone className="text-gold-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Call Us</h4>
                  <a href={`tel:${settings.phoneNumber}`} className="text-gray-400 text-xl hover:text-gold-500 transition-colors">+91 {settings.phoneNumber}</a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-emerald-900/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gold-500/20">
                  <MapPin className="text-gold-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Location</h4>
                  <p className="text-gray-400 text-xl">Areekode, Kerala, India</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-emerald-900/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gold-500/20">
                  <MessageCircle className="text-gold-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">WhatsApp</h4>
                  <a 
                    href={`https://wa.me/91${settings.phoneNumber}?text=Hello%20Green%20Kerala%2C%20I%20would%20like%20to%20book%20a%20luxury%20travel%20vehicle.`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:bg-emerald-500 transition-all mt-2"
                  >
                    Chat on WhatsApp
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-emerald-900/50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-gold-500/20">
                  <Instagram className="text-gold-500" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-lg mb-1">Instagram</h4>
                  <a 
                    href={`https://instagram.com/${settings.instagramId}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 text-xl hover:text-gold-500 transition-colors"
                  >
                    @{settings.instagramId}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-10 rounded-3xl border-white/10"
          >
            <h3 className="text-2xl font-serif font-bold mb-8 text-white">Quick Booking Form</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitStatus && (
                <div className={`p-4 rounded-xl text-sm font-medium whitespace-pre-line ${submitStatus.type === 'success' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' : 'bg-red-900/30 text-red-400 border border-red-500/30'}`}>
                  {submitStatus.message}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest">Full Name</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest">Travel Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest">Pickup</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors pr-20"
                      placeholder="Location"
                      value={formData.pickup}
                      onChange={(e) => setFormData({...formData, pickup: e.target.value})}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={handleLocate}
                        disabled={isLocating}
                        className={`p-2 text-gray-500 hover:text-gold-500 transition-colors ${isLocating ? 'animate-pulse text-gold-500' : ''}`}
                        title="Use current location"
                      >
                        {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Navigation size={18} />}
                      </button>
                      <button 
                        type="button"
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.pickup || 'Kerala')}`, '_blank')}
                        className="p-2 text-gray-500 hover:text-gold-500 transition-colors"
                        title="Find on Google Maps"
                      >
                        <MapPin size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-widest">Destination</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/50 transition-colors pr-10"
                      placeholder="Location"
                      value={formData.destination}
                      onChange={(e) => setFormData({...formData, destination: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.destination || 'Kerala')}`, '_blank')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gold-500 transition-colors"
                      title="Find on Google Maps"
                    >
                      <MapPin size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-4 bg-emerald-900 text-gold-500 border border-gold-500/50 rounded-xl font-bold text-lg transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-800'}`}
              >
                {isSubmitting ? 'Sending...' : 'Submit Request'}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
      
      {/* Floating WhatsApp Button */}
      <motion.a
        href={`https://wa.me/91${settings.phoneNumber}?text=Hello%20Green%20Kerala%2C%20I%20would%20like%20to%20book%20a%20luxury%20travel%20vehicle.`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-emerald-500 transition-all border-2 border-white/20"
      >
        <MessageCircle size={32} />
      </motion.a>
    </section>
  );
};

const Footer = ({ user, onLogin, onLogout, settings }: { user: any, onLogin: () => void, onLogout: () => void, settings: AppSettings }) => {
  return (
    <footer className="py-12 px-6 bg-black border-t border-white/5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-900 rounded flex items-center justify-center border border-gold-500/30">
            <span className="text-gold-500 font-serif font-bold text-sm">GK</span>
          </div>
          <span className="text-white font-serif font-bold tracking-wider">GREEN KERALA</span>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-6">
            <a href={`https://instagram.com/${settings.instagramId}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gold-500 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="text-gray-500 hover:text-gold-500 transition-colors"><Facebook size={20} /></a>
            <a href="#" className="text-gray-500 hover:text-gold-500 transition-colors"><Twitter size={20} /></a>
          </div>
          
          {user ? (
            <button 
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <LogOut size={12} /> Logout ({user.email})
            </button>
          ) : (
            <button 
              onClick={onLogin}
              className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              <LogIn size={12} /> Owner Login
            </button>
          )}
        </div>

        <p className="text-gray-600 text-sm">
          © {new Date().getFullYear()} Green Kerala Luxury Travel. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let unsubscribeSettings: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // Initial isOwner check based on hardcoded email
      const isPrimaryOwner = currentUser?.email === OWNER_EMAIL;
      setIsOwner(isPrimaryOwner);

      // Fetch settings and update isOwner based on dynamic list
      unsubscribeSettings = onSnapshot(doc(db, 'settings', 'app'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as AppSettings;
          setSettings(data);
          
          // Update isOwner if user is in the dynamic owners list
          if (currentUser?.email) {
            const isDynamicOwner = data.owners?.includes(currentUser.email);
            setIsOwner(isPrimaryOwner || isDynamicOwner);
          }
        }
      });
    });

    // Validate connection to Firestore
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'gallery', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firestore connection test failed: client is offline. Check Firebase config.");
        }
      }
    };
    testConnection();

    return () => {
      unsubscribeAuth();
      if (unsubscribeSettings) unsubscribeSettings();
    };
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    try {
      await setDoc(doc(db, 'settings', 'app'), {
        ...newSettings,
        updatedAt: serverTimestamp()
      });
      alert("Settings updated successfully!");
    } catch (error) {
      const errInfo = handleFirestoreError(error, OperationType.WRITE, 'settings/app');
      alert(`Failed to update settings: ${errInfo.error}`);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert("Login failed: This domain is not authorized in the Firebase Console. Please add '" + window.location.hostname + "' to the 'Authorized domains' list in Firebase Authentication settings.");
      } else if (error.code === 'auth/popup-blocked') {
        alert("Login failed: The login popup was blocked by your browser. Please allow popups for this site.");
      } else {
        alert(`Login failed: ${error.message} (${error.code})`);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero settings={settings} />
      <About />
      <Features />
      <Gallery isOwner={isOwner} />
      {isOwner && <AdminSettings settings={settings} onUpdate={handleUpdateSettings} />}
      <ServiceArea />
      <Contact settings={settings} />
      <Footer user={user} onLogin={handleLogin} onLogout={handleLogout} settings={settings} />
    </div>
  );
}
