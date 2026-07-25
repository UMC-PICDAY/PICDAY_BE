import cron from "node-cron";
import { anonymizeWithdrawnUsers } from "../domains/auth/auth.service.js";

export function startAnonymizeWithdrawnUsersBatch(){
    // 매일 새벽 4시
    cron.schedule("0 4 * * *", async () => {
        try{
            const count = await anonymizeWithdrawnUsers();
            if (count > 0){
                console.log(`[batch] 탈퇴 회원 익명화 ${count} 건 처리 완료`);
            }
        } catch(error){
            console.error("[batch] anonymizeWithdrawnUsers 실패: ",error);
        }
    })
}