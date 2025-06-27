import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Shield,
  Users,
  BookOpen,
  CheckCircle
} from 'lucide-react';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, error, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password, rememberMe });
      
      if (result.success) {
        console.log('✅ Login successful');
      }
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: Shield,
      title: 'Sécurité Avancée',
      description: 'Authentification sécurisée et protection des données'
    },
    {
      icon: Users,
      title: 'Gestion d\'Équipe',
      description: 'Gérez vos formateurs et participants en toute simplicité'
    },
    {
      icon: BookOpen,
      title: 'Formation Complète',
      description: 'Suivi complet des formations et certifications'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="flex min-h-screen">
        {/* Left Panel - Features */}
        <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-accent to-accent-dark p-12 text-white">
          <div className="flex flex-col justify-center max-w-lg">
            <div className="mb-8">
              <img 
                src="/Logo JLC MERCURY GRIS.png" 
                alt="JLC Mercury Logo" 
                className="w-16 h-16 object-contain mb-6 filter brightness-0 invert"
              />
              <h1 className="text-4xl font-bold mb-4">Formation Pro</h1>
              <p className="text-xl text-accent-light">
                Plateforme moderne de gestion des formations professionnelles
              </p>
            </div>

            <div className="space-y-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-accent-light text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3 mb-3">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Plateforme sécurisée et fiable</span>
              </div>
              <p className="text-sm text-accent-light">
                Rejoignez les entreprises qui font confiance à Formation Pro
              </p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 lg:hidden">
              <img 
                src="/Logo JLC MERCURY GRIS.png" 
                alt="JLC Mercury Logo" 
                className="w-12 h-12 object-contain mx-auto mb-4"
              />
              <h1 className="text-2xl font-bold text-primary-800">Formation Pro</h1>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl border border-primary-200 p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-primary-800 mb-2">Connexion</h2>
                <p className="text-primary-600">
                  Accédez à votre espace de formation
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mb-6 bg-error-light bg-opacity-20 border border-error rounded-xl p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-error-dark font-medium mb-1">Erreur de connexion</h4>
                    <p className="text-error-dark text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-primary-700 text-sm font-semibold mb-3">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-primary-50 border-2 border-primary-200 rounded-xl text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                      placeholder="votre@email.com"
                      required
                      disabled={isSubmitting || isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-primary-700 text-sm font-semibold mb-3">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-primary-50 border-2 border-primary-200 rounded-xl text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent transition-all duration-200"
                      placeholder="••••••••"
                      required
                      disabled={isSubmitting || isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-primary-400 hover:text-primary-600 transition-colors duration-200"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-accent bg-primary-50 border-2 border-primary-300 rounded focus:ring-accent focus:ring-2"
                      disabled={isSubmitting || isLoading}
                    />
                    <span className="text-primary-700 text-sm">Se souvenir de moi</span>
                  </label>

                  <Link
                    to="/forgot-password"
                    className="text-sm text-accent hover:text-accent-dark transition-colors duration-200 font-medium"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading || !email.trim() || !password.trim()}
                  className="w-full bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-accent text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-3 shadow-lg"
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Connexion...</span>
                    </>
                  ) : (
                    <>
                      <span>Se connecter</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-8 p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-200">
                <h4 className="text-primary-800 font-semibold mb-3 text-center">
                  🚀 Comptes de démonstration
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-primary-700 font-medium mb-1">👑 Administrateur :</p>
                    <p className="text-primary-600">Email: admin@formation-pro.com</p>
                    <p className="text-primary-600">Mot de passe: AdminDemo2024!</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-primary-700 font-medium mb-1">🎓 Formateur :</p>
                    <p className="text-primary-600">Email: formateur@formation-pro.com</p>
                    <p className="text-primary-600">Mot de passe: TrainerDemo2024!</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@formation-pro.com');
                    setPassword('AdminDemo2024!');
                  }}
                  className="mt-3 w-full text-xs text-accent hover:text-accent-dark transition-colors duration-200 font-medium bg-white py-2 rounded-lg"
                >
                  Utiliser le compte administrateur
                </button>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-primary-600 text-sm">
                  Pas encore de compte ?{' '}
                  <Link
                    to="/register"
                    className="text-accent hover:text-accent-dark transition-colors duration-200 font-semibold"
                  >
                    Demander un accès
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;