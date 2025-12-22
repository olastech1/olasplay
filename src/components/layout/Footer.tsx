import { Link } from "react-router-dom";
import { Music2, Mail } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Footer = () => {
  const { data: settings } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Latest Songs", href: "/songs" },
    { name: "Top Artists", href: "/artists" },
    { name: "Categories", href: "/categories" },
    { name: "Search", href: "/search" },
  ];

  const genres = [
    { name: "Afrobeats", href: "/category/afrobeats" },
    { name: "Amapiano", href: "/category/amapiano" },
    { name: "Hip Hop", href: "/category/hip-hop" },
    { name: "R&B", href: "/category/rnb" },
  ];

  const legal = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "DMCA", href: "/dmca" },
    { name: "Sitemap", href: "/sitemap.xml" },
  ];

  // Parse footer text or use default with current year
  const footerText = settings?.footer_text?.replace("{year}", String(currentYear)) 
    || `© ${currentYear} ${settings?.site_name || "OlasPlay"}. All rights reserved.`;

  return (
    <footer className="bg-card/50 border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              {settings?.logo_url ? (
                <img 
                  src={settings.logo_url} 
                  alt={settings?.site_name || "Logo"} 
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Music2 className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
              <span className="text-xl font-bold gradient-text">
                {settings?.site_name || "OlasPlay"}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {settings?.site_tagline || "Your ultimate destination for the latest and hottest music downloads. Free MP3 downloads from top artists worldwide."}
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>contact@olasplay.com</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Top Genres</h3>
            <ul className="space-y-2">
              {genres.map((genre) => (
                <li key={genre.name}>
                  <Link
                    to={genre.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {genre.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2">
              {legal.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {footerText}
          </p>
          <p className="text-muted-foreground text-xs">
            Music files are provided for promotional purposes only. Support the artists by purchasing their music.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
