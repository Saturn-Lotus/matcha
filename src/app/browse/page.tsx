'use client';

import { useState } from "react";
import { Heart, X, MessageSquare } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { useRouter } from "next/navigation";

const Browse = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  const profiles = [
    {
      id: 1,
      name: "Sarah",
      age: 26,
      location: "New York",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=600&fit=crop&crop=face",
      bio: "Love hiking, coffee shops, and spontaneous adventures. Looking for someone to explore the city with!",
      interests: ["Travel", "Photography", "Yoga", "Coffee"]
    },
    {
      id: 2,
      name: "Emma",
      age: 24,
      location: "Los Angeles",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=600&fit=crop&crop=face",
      bio: "Artist and dog lover. Spending weekends at galleries or beach walks with my golden retriever.",
      interests: ["Art", "Dogs", "Beach", "Music"]
    },
    {
      id: 3,
      name: "Jessica",
      age: 28,
      location: "Chicago",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face",
      bio: "Foodie and book enthusiast. Always down for trying new restaurants or cozy reading sessions.",
      interests: ["Reading", "Cooking", "Wine", "Travel"]
    }
  ];

  const matches = [
    { id: 1, name: "Lisa", image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=60&h=60&fit=crop&crop=face", lastMessage: "Hey! How's your day going?" },
    { id: 2, name: "Anna", image: "https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=60&h=60&fit=crop&crop=face", lastMessage: "Would love to chat more!" },
    { id: 3, name: "Maya", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=60&h=60&fit=crop&crop=face", lastMessage: "Thanks for the match 😊" }
  ];

  const handleLike = () => {
    setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
  };

  const handlePass = () => {
    setCurrentProfileIndex((prev) => (prev + 1) % profiles.length);
  };

  const router = useRouter();

  const currentProfile = profiles[currentProfileIndex];

  return (
    <div className="h-full">

      <div className="flex h-full">
        {/* Matches Sidebar */}
        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          <h2 className="text-xl font-bold mb-6 gradient-text">Your Matches</h2>
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-pink-50 cursor-pointer transition-colors">
                <img
                  src={match.image}
                  alt={match.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800">{match.name}</p>
                  <p className="text-sm text-gray-500 truncate">{match.lastMessage}</p>
                </div>
                <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white rounded-xl"
            onClick={() => router.push("/chat")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Open Chat
          </Button>
        </div>

        {/* Main Browse Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-sm w-full">
            <Card className="glass-effect border-0 shadow-2xl rounded-3xl overflow-hidden">
              <div className="relative">
                <img
                  src={currentProfile.image}
                  alt={currentProfile.name}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                  <h3 className="text-2xl font-bold">{currentProfile.name}, {currentProfile.age}</h3>
                  <p className="text-sm opacity-90">{currentProfile.location}</p>
                </div>
              </div>
              
              <CardContent className="p-6">
                <p className="text-gray-600 mb-4">{currentProfile.bio}</p>
                
                <div className="flex flex-wrap gap-2 mb-6">
                  {currentProfile.interests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={handlePass}
                    className="w-14 h-14 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                    variant="ghost"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                  <Button
                    onClick={handleLike}
                    className="w-14 h-14 rounded-full heart-gradient hover:scale-110 text-white transition-transform"
                  >
                    <Heart className="w-6 h-6 fill-current" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
