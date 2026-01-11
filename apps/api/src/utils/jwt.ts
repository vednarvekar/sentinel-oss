import jwt from "jsonwebtoken"
import "dotenv/config"

const JWT_SECRET = process.env.JWT_SECRET;

export const signToken = (userId: string, sessionId: string) => {
    if(!JWT_SECRET){
        throw new Error("Missing JWT SECRET");
    }

    const payload = {userId, sessionId};
    
    const token = jwt.sign(payload, JWT_SECRET, {expiresIn: "15m"})
    
return token;
}

export const verifyToken = (token: string) => {
    if(!JWT_SECRET){
        throw new Error("Missing JWT SECRET");
    }

    if(!token) {
        throw new Error("Missing Token");
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string, sessionId: string;
    }

return {
    userId: decoded.userId,
    sessionId: decoded.sessionId
};
}