import { Button } from '@/app/components/ui/button';
import { Heart, MessageSquare, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 flex items-center  h-full justify-center">
      <div className="text-center max-w-4xl mx-auto">
        <h2 className="text-6xl font-bold mt-6 mb-6 strawberry-matcha-gradient">
          Sweet Connections, Fresh Starts
        </h2>
        <p className="text-xl mb-12 max-w-2xl mx-auto text-text-muted">
          Like the perfect blend of strawberry and matcha, find your perfect
          match. Sweet, refreshing, and uniquely yours.
        </p>

        <div className="space-y-4 mb-16">
          <Button
            size="lg"
            className="strawberry-matcha-btn hover:opacity-90 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-card-bg"
          >
            Start Your Journey
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-2 md:gap-8 mt-16">
          <div className="glass-effect p-6 rounded-2xl border border-card-border">
            <Users className="h-12 w-12 mx-auto mb-4 text-icon-secondary" />
            <h3 className="text-xl font-semibold mb-2 matcha-gradient">
              Sweet Matching
            </h3>
            <p className="text-text-muted">
              Like finding the perfect matcha blend, we match you with
              compatible souls
            </p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-success-bg">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-icon-primary" />
            <h3 className="text-xl font-semibold mb-2 strawberry-gradient">
              Fresh Conversations
            </h3>
            <p className="text-text-muted">
              Start sweet conversations that bloom into meaningful connections
            </p>
          </div>
          <div className="glass-effect p-6 rounded-2xl border border-card-border">
            <Heart className="h-12 w-12 mx-auto mb-4 fill-current text-icon-secondary" />
            <h3 className="text-xl font-semibold mb-2 matcha-gradient">
              Authentic Love
            </h3>
            <p className="text-text-muted">
              Build genuine relationships with verified, authentic profiles
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
