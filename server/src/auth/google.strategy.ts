import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-google-oauth20";
import { AuthService } from "./auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google')
{
    
    constructor(private authService: AuthService)
    {
        super({
            clientID    : process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL : 'http://localhost:4000/api/auth/google/callback',
            passReqToCallback: true,
            scope: ['profile', 'email']
        })
    }


    async validate(request: any, accessToken: string, refreshToken: string, profile, done: Function) {
        const { emails } = profile;
        const email = emails.filter(mail => mail.value)[0].value;
        const googleUserInfo = {email, profile};
    
        done(null, googleUserInfo);
    }

}