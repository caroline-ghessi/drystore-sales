import { useState } from 'react';
import { Menu, X, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavBarProps {
  logoSrc?: string;
  onContactClick?: () => void;
}

export function NavBar({ logoSrc, onContactClick }: NavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const handleContactClick = () => {
    if (onContactClick) {
      onContactClick();
    } else {
      scrollToSection('contato');
    }
  };

  const navLinks = [
    { label: 'Características', id: 'caracteristicas' },
    { label: 'Produtos', id: 'produtos' },
    { label: 'Sobre Nós', id: 'sobre' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <div className="flex-shrink-0">
            {logoSrc ? (
              <img src={logoSrc} alt="Logo" className="h-10 md:h-12 w-auto" />
            ) : (
              <span className="text-xl font-bold text-drystore-orange">Drystore</span>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className="text-muted-foreground hover:text-foreground transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Button
              onClick={handleContactClick}
              className="bg-drystore-orange hover:bg-drystore-orange/90 text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              Fale Conosco
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className="text-left text-muted-foreground hover:text-foreground transition-colors font-medium py-2"
                >
                  {link.label}
                </button>
              ))}
              <Button
                onClick={handleContactClick}
                className="bg-drystore-orange hover:bg-drystore-orange/90 text-white mt-2"
              >
                <Phone className="w-4 h-4 mr-2" />
                Fale Conosco
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
