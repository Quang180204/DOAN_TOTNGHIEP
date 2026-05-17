import { HomeData } from "../types/product";

export async function getHomeData(): Promise<HomeData> {
  const res = await fetch("http://localhost:5000/api/home");

  if (!res.ok) {
    throw new Error("Cannot fetch API");
  }

  const data = (await res.json()) as HomeData;

  return data;
}