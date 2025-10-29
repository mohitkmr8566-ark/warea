import type { NextApiRequest, NextApiResponse } from "next";
import { zoneFromPincode, etaRange } from "../../lib/logistics";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const pincode = "110001"; // example metro pincode (Delhi)
  const zone = zoneFromPincode(pincode);
  const eta = etaRange(zone);

  res.status(200).json({ pincode, zone, eta });
}
