import express from "express";
import { addRoom, adminAllBookings, adminAllRooms, adminLogin, calculateTotalRevenue, changeIsPaid, deleteRoom, fetchRoom, handleStatus, monthSales, TotalBookings, updateRoom } from "../Controller/AdminController.js";
import AdminAuth from "../middleware/authAdmin.js";
import upload from "../middleware/multer.js";

const AdminRouter = express.Router();


AdminRouter.post("/admin-login",adminLogin);
AdminRouter.post("/add-room",AdminAuth,upload.array("images",4),addRoom);
AdminRouter.post("/totalRevenue",AdminAuth,calculateTotalRevenue);
AdminRouter.post("/totalBookings",AdminAuth,TotalBookings);
AdminRouter.post("/adminAllRooms",AdminAuth,adminAllRooms);
AdminRouter.post("/adminAllBookings",AdminAuth,adminAllBookings);
AdminRouter.post("/changeIsPaid",AdminAuth,changeIsPaid);
AdminRouter.post("/changeStatus",AdminAuth,handleStatus);
AdminRouter.post("/fetchRoom",AdminAuth,fetchRoom);
AdminRouter.post("/updateRoom",AdminAuth,updateRoom);
AdminRouter.post("/deleteRoom",AdminAuth,deleteRoom);
AdminRouter.post("/month-sales",AdminAuth,monthSales);

export default AdminRouter;