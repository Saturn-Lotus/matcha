import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Users } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex items-center justify-center">
		<div className="text-center max-w-4xl mx-auto">
		<h2 className="text-6xl font-bold mb-6 strawberry-matcha-gradient">
			Sweet Connections, Fresh Starts
		</h2>
		<p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
			Like the perfect blend of strawberry and matcha, find your perfect match. 
			Sweet, refreshing, and uniquely yours.
		</p>
		
		<div className="space-y-4 mb-16">
			<Button
				size="lg" 
				className="strawberry-matcha-btn hover:opacity-90 text-white px-12 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
			>
				Start Your Journey
			</Button>
		</div>

		<div className="grid md:grid-cols-3 gap-8 mt-16">
			<div className="glass-effect p-6 rounded-2xl border border-pink-100">
			<Users className="h-12 w-12 text-green-500 mx-auto mb-4" />
			<h3 className="text-xl font-semibold mb-2 matcha-gradient">Sweet Matching</h3>
			<p className="text-gray-600">Like finding the perfect matcha blend, we match you with compatible souls</p>
			</div>
			<div className="glass-effect p-6 rounded-2xl border border-green-100">
			<MessageSquare className="h-12 w-12 text-pink-400 mx-auto mb-4" />
			<h3 className="text-xl font-semibold mb-2 strawberry-gradient">Fresh Conversations</h3>
			<p className="text-gray-600">Start sweet conversations that bloom into meaningful connections</p>
			</div>
			<div className="glass-effect p-6 rounded-2xl border border-pink-100">
			<Heart className="h-12 w-12 text-green-500 mx-auto mb-4 fill-current" />
			<h3 className="text-xl font-semibold mb-2 matcha-gradient">Authentic Love</h3>
			<p className="text-gray-600">Build genuine relationships with verified, authentic profiles</p>
			</div>
		</div>
		</div>
	</div>
  );
}
