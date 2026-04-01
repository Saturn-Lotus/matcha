'use client';

import { useState } from 'react';
import { Save, Trash2, Plus } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';

const GENDER_OPTIONS = ['male', 'female'];
const PREFERENCE_OPTIONS = ['male', 'female', 'both'];

const Settings = () => {
  const [formData, setFormData] = useState({
    age: '',
    location: '',
    bio: '',
    gender: '',
    sexualPreference: '',
  });

  const [interests, setInterests] = useState<string[]>([
    'Travel',
    'Music',
    'Photography',
  ]);
  const [newInterest, setNewInterest] = useState('');
  const [photos] = useState<
    Array<{ id: string; url: string; isProfile: boolean }>
  >([]);

  const handleAddInterest = () => {
    if (!newInterest.trim()) return;
    setInterests([...interests, newInterest.trim()]);
    setNewInterest('');
  };

  const handleRemoveInterest = (interestName: string) => {
    setInterests(interests.filter((i) => i !== interestName));
  };

  return (
    <div className="h-full strawberry-matcha-bg overflow-y-auto container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold strawberry-matcha-gradient mb-8">
        Settings
      </h1>

      <Card className="glass-effect border-0 shadow-xl mb-6">
        <CardHeader>
          <CardTitle className="strawberry-gradient">
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="border-pink-200 focus:border-pink-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full rounded-md border border-pink-200 bg-transparent px-3 py-2 text-sm focus:border-pink-400 outline-none"
              >
                <option value="" disabled>
                  Select gender
                </option>
                {GENDER_OPTIONS.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="preference">Sexual Preference</Label>
              <select
                id="preference"
                value={formData.sexualPreference}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sexualPreference: e.target.value,
                  })
                }
                className="w-full rounded-md border border-pink-200 bg-transparent px-3 py-2 text-sm focus:border-pink-400 outline-none"
              >
                <option value="" disabled>
                  Select preference
                </option>
                {PREFERENCE_OPTIONS.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) =>
                setFormData({ ...formData, bio: e.target.value })
              }
              rows={4}
              className="border-pink-200 focus:border-pink-400"
              placeholder="Tell us about yourself..."
            />
          </div>

          <Button className="strawberry-matcha-btn text-white hover:opacity-90">
            <Save className="w-4 h-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl mb-6">
        <CardHeader>
          <CardTitle className="strawberry-gradient">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt="Profile"
                  className="w-full h-32 object-cover rounded-xl"
                />
                <button className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
                {photo.isProfile && (
                  <div className="absolute bottom-2 left-2 bg-pink-500 text-white text-xs px-2 py-1 rounded">
                    Profile
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              className="border-pink-200"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="strawberry-gradient">Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3 mb-4">
            {interests.map((interest) => (
              <div
                key={interest}
                className="px-4 py-2 strawberry-matcha-btn text-white rounded-full flex items-center gap-2"
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="hover:bg-white/20 rounded-full p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add new interest"
              className="border-pink-200 focus:border-pink-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
            />
            <Button
              onClick={handleAddInterest}
              className="strawberry-matcha-btn text-white hover:opacity-90"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
