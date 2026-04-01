'use client';

import { useState } from "react";
import { Camera, Edit } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "Alex Johnson",
    age: 28,
    location: "San Francisco, CA",
    bio: "Adventure seeker, coffee enthusiast, and dog lover. Always looking for new experiences and meaningful connections. Love hiking, trying new restaurants, and spontaneous road trips!",
    interests: ["Travel", "Photography", "Hiking", "Coffee", "Dogs", "Music"],
    photos: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face",
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1539571696537-8b5b5e68a0fc?w=400&h=500&fit=crop",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=500&fit=crop"
    ]
  });

  const stats = [
    { label: "Matches", value: "127" },
    { label: "Messages", value: "43" },
    { label: "Likes Given", value: "284" }
  ];

  return (
    <div className="min-h-screen container mx-auto px-4 py-8 pt-24 max-w-4xl">
      {/* Profile Header */}
      <Card className="glass-effect border-0 shadow-xl mb-8">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            <div className="relative">
              <img
                src={profile.photos[0]}
                alt={profile.name}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button className="absolute bottom-0 right-0 w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center text-white hover:bg-pink-600 transition-colors">
                <Camera className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    {profile.name}, {profile.age}
                  </h1>
                  <p className="text-gray-600">{profile.location}</p>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="mt-4 md:mt-0 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </Button>
              </div>

              {isEditing ? (
                <Textarea
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full rounded-xl border-gray-200 focus:border-pink-300"
                  rows={4}
                />
              ) : (
                <p className="text-gray-600 text-lg leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-effect border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <p className="text-3xl font-bold gradient-text mb-2">{stat.value}</p>
              <p className="text-gray-600">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Photos Grid */}
      <Card className="glass-effect border-0 shadow-xl mb-8">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 gradient-text">My Photos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {profile.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl shadow-md group-hover:shadow-lg transition-shadow"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-300 flex items-center justify-center">
                  <button className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-white rounded-full flex items-center justify-center text-pink-500 hover:text-pink-600 transition-all">
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interests */}
      <Card className="glass-effect border-0 shadow-xl">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold mb-6 gradient-text">My Interests</h2>
          <div className="flex flex-wrap gap-3">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-gradient-to-r from-pink-100 to-red-100 text-pink-700 rounded-full font-medium hover:from-pink-200 hover:to-red-200 transition-colors cursor-pointer"
              >
                {interest}
              </span>
            ))}
            {isEditing && (
              <button className="px-4 py-2 border-2 border-dashed border-pink-300 text-pink-500 rounded-full hover:border-pink-400 hover:text-pink-600 transition-colors">
                + Add Interest
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
