import { roles } from "../../DB/Models/User.model.js";
import { restoreAccount } from "./user.service.js";

export const endPoints = {
    getSingleUser: [roles.user, roles.admin],
    updateProfile: [roles.user, roles.admin],
    freezeAccount:[roles.user, roles.admin],
    restoreAccount:[ roles.admin],
    restoreAccountByUser:[roles.user],
    deleteHardAccount:[ roles.admin],
    updatePassword:[roles.user, roles.admin],
}
