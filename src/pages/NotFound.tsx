import { Link } from "react-router-dom";
import { Home, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import SEOHead from "@/components/seo/SEOHead";

const NotFound = () => {
  return (
    <>
      <SEOHead
        title="Page Not Found"
        description="The page you're looking for doesn't exist. Browse our music library for free MP3 downloads."
      />
      <Layout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Music className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold gradient-text mb-4">404</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
              Page Not Found
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Oops! The page you're looking for doesn't exist or has been moved. 
              Let's get you back to the music.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/">
                <Button variant="gradient" size="lg" className="gap-2">
                  <Home className="w-5 h-5" />
                  Go Home
                </Button>
              </Link>
              <Link to="/songs">
                <Button variant="outline" size="lg" className="gap-2">
                  <Music className="w-5 h-5" />
                  Browse Songs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default NotFound;
