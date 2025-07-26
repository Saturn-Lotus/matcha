export const genderValues = ['male', 'female'] as const;
export type Gender = (typeof genderValues)[number];

export type SexualPreference = Gender | 'both';

export type Interests = string[];

export type User = {
  id: 'string';
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at?: Date;
  updated_at?: Date;
  password_hash: string;
  is_verified: boolean;
};

export type UserProfile = {
  user_id: string;
  bio: string;
  gender: Gender;
  sexual_preference: SexualPreference;
  avatar_url: string;
  interests: Interests;
  pictures: string[];
  created_at?: Date;
  updated_at?: Date;
};

export type UserWithProfile = Omit<User, 'password_hash'> &
  Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>;
