import connectDB from "../config/db.js";
import { runReminderForAllLeads } from "../utils/reminderLogic.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }


  try {
    await connectDB();
    await runReminderForAllLeads();
    return res.status(200).json({ message: "Reminder cron executed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
