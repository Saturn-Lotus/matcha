import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, User, Lock, Mail } from "lucide-react"
import Link from "next/link"
import FormInputRow from "./ui/form-input-row"

export const RegisterForm = () => {
  return (
    <div className="min-h-screen flex bg-strawberry-matcha">
		<div className="w-full max-w-md">
			<div className="text-center mb-8">
			<h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
			<Heart className="h-8 w-8 text-pink-400 fill-current mr-2" />
			Strawberry Matcha
			</h1>
				<p className="text-gray-600">Join thousands finding love every day!</p>
			</div>
			<Card className="bg-white">
			<CardHeader className="justify-center text-xl">
				<CardTitle className="font-bold">Sign Up</CardTitle>
			</CardHeader>
			<CardContent>
				<form>
				<div className="flex flex-col gap-4">
					<FormInputRow
						id="firstname"
						type="text"
						placeholder="First Name"
						icon={<User className="h-5 w-5 text-gray-400" />} 
					/>
					<FormInputRow
						id="lastname"
						type="text"
						placeholder="Last Name"
						icon={<User className="h-5 w-5 text-gray-400" />}
					/>
					<FormInputRow
						id="username"
						type="username"
						placeholder="Username"
						icon={<User className="h-5 w-5 text-gray-400" />}
					/>
					<FormInputRow
						id="email"
						type="email"
						placeholder="Email"
						icon={<Mail className="h-5 w-5 text-gray-400" />}
					/>
					<FormInputRow
						id="password"
						type="password"
						placeholder="Password"
						icon={<Lock className="h-5 w-5 text-gray-400" />}
					/>
					<FormInputRow
						id="confirmedpassword"
						type="password"
						placeholder="Confirm Password"
						icon={<Lock className="h-5 w-5 text-gray-400" />}
					/>
					<div className="flex flex-col gap-3">
					<Button type="submit" className="w-full h-10 strawberry-matcha-btn hover:opacity-90 text-white">
						Sign Up
					</Button>
					</div>
				</div>
				<div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Already have an account?{" "}
				<Link href="/login" className="text-pink-500 hover:text-pink-700 font-semibold">
				  Sign in here
				</Link>
              </p>
            </div>
				</form>
			</CardContent>
			</Card>
		</div>
    </div>
  )
}
