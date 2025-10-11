import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Heart, User, Lock } from "lucide-react"
import Link from "next/link"
import FormInputRow from "./ui/form-input-row"

export function LoginForm() {
  return (
    <div className="flex bg-strawberry-matcha">
		<div className="w-full max-w-md">
			<div className="text-center mb-8">
			<h1 className="text-2xl font-bold strawberry-matcha-gradient flex items-center justify-center space-x-2">
			<Heart className="h-8 w-8 text-pink-400 fill-current mr-2" />
			Strawberry Matcha
			</h1>
				<p className="text-gray-600">Welcome back! Let's brew some sweet connections.</p>
			</div>
			<Card className="bg-white">
			<CardHeader className="justify-center text-xl">
				<CardTitle className="font-bold">Sign In</CardTitle>
			</CardHeader>
			<CardContent>
				<form>
				<div className="flex flex-col gap-4">
					<FormInputRow
						id="username"
						type="username"
						placeholder="Username"
						icon={<User className="h-5 w-5 text-gray-400" />}
					/>
					<FormInputRow
						id="password"
						type="password"
						placeholder="Password"
						icon={<Lock className="h-5 w-5 text-gray-400" />}
					/>
					<div className="flex flex-col gap-3">
					<Button type="submit" className="w-full strawberry-matcha-btn hover:opacity-90 text-white">
						Sign In
					</Button>
					<Link
					href="/forgot-password"
					className="ml-auto text-sm underline-offset-4 hover:underline flex items-center justify-center m-5 w-full gap-1 text-green-600 hover:text-green-800"
					>
					Forgot your password?
					</Link>
					</div>
				</div>
				<div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-600">
                Don't have an account?{" "}
				<Link href="/register" className="text-pink-500 hover:text-pink-700 font-semibold">
				  Sign up here
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
