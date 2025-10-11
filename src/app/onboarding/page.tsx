'use client'
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Heart } from "lucide-react";

const POPULAR_INTERESTS = [
  "Travel", "Photography", "Hiking", "Coffee", "Dogs", "Music",
  "Fitness", "Reading", "Cooking", "Art", "Gaming", "Yoga",
  "Vegan", "Geek", "Piercing", "Tattoos", "Dancing", "Movies"
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    gender: "",
    sexualPreference: "",
    age: "",
    location: "",
    bio: "",
    customInterest: ""
  });
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [profilePictureIndex, setProfilePictureIndex] = useState(0);


  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    if (profilePictureIndex >= newPhotos.length) {
      setProfilePictureIndex(Math.max(0, newPhotos.length - 1));
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const addCustomInterest = () => {
    if (formData.customInterest.trim()) {
      const formatted = formData.customInterest.trim().toLowerCase();
      if (!selectedInterests.includes(formatted)) {
        setSelectedInterests([...selectedInterests, formatted]);
      }
      setFormData({ ...formData, customInterest: "" });
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="gender">Gender *</Label>
        <select
          id="gender"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
          value={formData.gender}
          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
        >
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="non_binary">Non-binary</option>
          <option value="other">Other</option>
          <option value="prefer_not_to_say">Prefer not to say</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="preference">I'm interested in *</Label>
        <select
          id="preference"
          className="flex h-10 w-full rounded-md border border-gray-300 bg-background px-3 py-2 text-sm"
          value={formData.sexualPreference}
          onChange={(e) => setFormData({ ...formData, sexualPreference: e.target.value })}
        >
          <option value="">Select preference</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="everyone">Everyone</option>
        </select>
      </div>

      <div className="space-y-1">
        <Label htmlFor="age">Age</Label>
        <Input
          id="age"
          className="border border-gray-300 rounded-md placeholder:text-gray-400"
          type="number"
          placeholder="25"
          value={formData.age}
          onChange={(e) => setFormData({ ...formData, age: e.target.value })}
		  />
      </div>

      <div className="space-y-1">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          className="border border-gray-300 rounded-md placeholder:text-gray-400"
          placeholder="Meknes, MA"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <Button
        onClick={() => setStep(2)}
        className="w-full strawberry-matcha-btn hover:opacity-90 text-white"
      >
        Next
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="bio">About Me</Label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself..."
		  className="border border-gray-300 rounded-md p-2 w-full"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={5}
        />
      </div>

      <div>
        <Label>Interests</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {POPULAR_INTERESTS.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedInterests.includes(interest.toLowerCase())
                  ? 'strawberry-matcha-btn text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{interest}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Add custom interest"
			className="border border-gray-300 rounded-md placeholder:text-gray-400"
            value={formData.customInterest}
            onChange={(e) => setFormData({ ...formData, customInterest: e.target.value })}
			/>
          <Button
            type="button"
			className="border border-gray-300 rounded-md"
            onClick={addCustomInterest}
            variant="outline"
          >
            Add
          </Button>
        </div>

        {selectedInterests.filter(i => !POPULAR_INTERESTS.map(p => p.toLowerCase()).includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {selectedInterests
              .filter(i => !POPULAR_INTERESTS.map(p => p.toLowerCase()).includes(i))
              .map((interest) => (
                <span
                  key={interest}
                  className="px-4 py-2 strawberry-matcha-btn text-white rounded-full text-sm font-medium"
                >
                  #{interest}
                </span>
              ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep(1)}
          variant="outline"
          className="flex-1 border border-gray-300"
        >
          Back
        </Button>
        <Button
          onClick={() => setStep(3)}
          className="flex-1 strawberry-matcha-btn hover:opacity-90 text-white"
        >
          Next
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <Label>Upload Photos (1-5) *</Label>
        <p className="text-sm mb-4 text-gray-400">
          Upload up to 5 photos. Click on a photo to set it as your profile picture.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-4">
          {photos.map((photo, index) => (
            <div
              key={index}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 cursor-pointer"
              style={{
                borderColor: index === profilePictureIndex ? '#ec4899' : 'transparent'
              }}
              onClick={() => setProfilePictureIndex(index)}
            >
              <img
                src={URL.createObjectURL(photo)}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {index === profilePictureIndex && (
                <div className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-1 rounded text-xs font-medium">
                  <Heart className="w-3 h-3 inline mr-1" />
                  Profile
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(index);
                }}
                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {photos.length < 5 && (
            <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-pink-400 transition-colors cursor-pointer flex flex-col items-center justify-center">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
              />
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Upload</span>
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => setStep(2)}
          variant="outline"
          className="flex-1 border border-gray-300"
        >
          Back
        </Button>
        <Button
          disabled={loading || photos.length === 0}
          className="flex-1 strawberry-matcha-btn hover:opacity-90 text-white"
        >
          {loading ? 'Creating Profile...' : 'Complete Profile'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen strawberry-matcha-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl glass-effect border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center strawberry-matcha-gradient">
            Complete Your Profile
          </CardTitle>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 w-16 rounded-full transition-colors ${
                  s <= step
                    ? 'strawberry-matcha-btn'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
