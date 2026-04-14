'use client';

import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { User, Mail, Info } from 'lucide-react';

export interface UserInfoFields {
  firstName: string;
  lastName: string;
  email: string;
}

interface UserInfoTabProps {
  fields: UserInfoFields;
  currentEmail: string;
  submitting: boolean;
  onChange: (fields: UserInfoFields) => void;
}

export function UserInfoTab({ fields, currentEmail, submitting, onChange }: UserInfoTabProps) {
  const set = (patch: Partial<UserInfoFields>) => onChange({ ...fields, ...patch });

  return (
    <div className="space-y-6">
      <Card className="glass-effect border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-pink-500" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={fields.firstName}
                onChange={(e) => set({ firstName: e.target.value })}
                placeholder="First name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={fields.lastName}
                onChange={(e) => set({ lastName: e.target.value })}
                placeholder="Last name"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="flex items-center gap-1">
              <Mail className="w-4 h-4 text-pink-400" />
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              value={fields.email}
              onChange={(e) => set({ email: e.target.value })}
              placeholder="your@email.com"
            />
            {fields.email !== currentEmail && (
              <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                <Info className="w-3 h-3" />
                A verification link will be sent to confirm the new address.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={submitting} className="w-full strawberry-matcha-btn hover:opacity-90 text-white">
        {submitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
}
