/**
 * One shared, deterministic mock universe. Every page pulls people, jobs and
 * references from here instead of inventing its own disconnected list, so a
 * user you suspend on the Users page is the same person who shows up in
 * Transactions, RFQs and Escrow — which is what makes a prototype read as a
 * real product instead of five separate demos stapled together.
 */

let seed = 7;
function rand(): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
export function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
export function int(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
export function daysAgo(n: number, withTime = false): string {
  const d = new Date("2026-09-22T09:30:00Z");
  d.setDate(d.getDate() - n);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  if (!withTime) return date;
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return `${date}, ${time}`;
}
export function uprn(): string {
  return String(int(100000000000, 999999999999));
}
export function ref(prefix: string): string {
  return `${prefix}-${int(100000, 999999)}`;
}
export function naira(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

const firstNames = ["Daniel", "Chidinma", "Michael", "Sarah", "Tunde", "Fatima", "Emmanuel", "Grace", "Bola", "Amara", "Robert", "Ngozi", "Kelechi", "Lucy", "Kayode", "Hannah", "Ibrahim", "Chloe", "Segun", "Ruth", "Peter", "Blessing", "Adaeze", "Femi"];
const lastNames = ["Okafor", "Johnson", "Williams", "Adeyemi", "Bello", "Mensah", "Eze", "Balogun", "Osei", "Taylor", "Nwosu", "Clarke", "Ogundele", "Green", "Afolabi", "Hughes", "Musa", "Ibe"];
const countries = ["Nigeria", "Nigeria", "Nigeria", "Ghana", "United Kingdom", "Nigeria"];
const cities: Record<string, string[]> = {
  Nigeria: ["Lekki, Lagos", "Ikeja, Lagos", "Yaba, Lagos", "Ibadan, Oyo", "Abuja FCT", "Enugu, Enugu", "Port Harcourt, Rivers"],
  Ghana: ["Accra", "Kumasi"],
  "United Kingdom": ["Manchester", "Croydon, London", "Leeds", "Bristol"],
};
const dialCode: Record<string, string> = { Nigeria: "+234", Ghana: "+233", "United Kingdom": "+44" };
const tradeJobs = ["Boiler service", "Kitchen fitting", "Roofing repair", "Bathroom refit", "Fence installation", "Painting & decorating", "Guttering repair", "Damp proofing", "Tiling", "Landscaping", "Electrical rewiring", "Plumbing repair"];
const companyNames = ["Prime Facilities Ltd", "BrightHome Services", "Solidfix Contractors", "Coastal Trades Co", "Northgate Maintenance", "Urban Renovate Ltd"];

export interface Person {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  role: "Buyer" | "Seller" | "Agent";
  company?: string;
  status: "Active" | "Inactive" | "Suspended";
  verified: boolean;
  trustScore: number;
  joined: string;
  lastActive: string;
}

function person(idNum: number): Person {
  const country = pick(countries);
  const city = pick(cities[country]);
  const role = pick<Person["role"]>(["Buyer", "Buyer", "Seller", "Seller", "Agent"]);
  const first = pick(firstNames);
  const last = pick(lastNames);
  const status = pick<Person["status"]>(["Active", "Active", "Active", "Active", "Inactive", "Suspended"]);
  return {
    id: `USR-${String(idNum).padStart(3, "0")}`,
    name: `${first} ${last}`,
    email: `${first.toLowerCase()}.${last.toLowerCase()}@example.com`,
    phone: `${dialCode[country]} ${int(700, 909)} ${int(100, 999)} ${int(1000, 9999)}`,
    country,
    city,
    role,
    company: role === "Agent" && rand() > 0.5 ? pick(companyNames) : undefined,
    status,
    verified: rand() > 0.15,
    trustScore: status === "Suspended" ? int(15, 45) : int(55, 99),
    joined: daysAgo(int(30, 720)),
    lastActive: daysAgo(int(0, status === "Active" ? 6 : 60)),
  };
}

export const people: Person[] = Array.from({ length: 24 }).map((_, i) => person(i + 1));
export const Buyer = people.filter((p) => p.role === "Buyer");
export const Seller = people.filter((p) => p.role === "Seller");
export const tradespeople = people.filter((p) => p.role === "Agent");

export function jobTitle(): string {
  return pick(tradeJobs);
}