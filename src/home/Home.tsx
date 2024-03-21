import React, { useContext, useEffect, useState } from "react";
import ActionAreaCard from "./Card.tsx";
//import {getUser} from "../A/contextPage.tsx";
import { SearchContext, useAuth } from "../App.tsx";
import { Filter } from "./Filter.tsx";
import { calculateDistance } from "../GoogleAPI/CalculateDistance.tsx";
import { Box, Typography } from "@mui/material";
import { sql } from "@vercel/postgres";

export type postProps = {
  id: number;
  title: string;
  image: string;
  price: number;
  dateFrom: Date;
  dateTo: Date;
  description: string;
  location: string;
  categoryId: number;
  userId: number;
};

type postState = {
  posts: postProps[];
};

export function Home() {
  const [filteredPosts, setFilteredPosts] = useState<postProps[]>([]);
  const [posts, setPosts] = useState<postProps[]>([]);
  const [sliderValue, setSliderValue] = useState(50);
  const [userAddress, setUserAddress] = useState("");
  const { searchText } = useContext(SearchContext);
  const { sessionInfo } = useAuth();

  async function getPosts(): Promise<postProps[]> {
    const response = await fetch("https://borroapi.azurewebsites.net/api/Post");
    return await response.json();
  }

  useEffect(() => {
    getPosts().then((posts: postProps[]) => setPosts(posts));
  }, []);

  useEffect(() => {
    async function fetchUserAddress() {
      //const userData = await getUser();
      setUserAddress(sessionInfo?.address ?? "");
    }

    fetchUserAddress();
  }, [sessionInfo]);

  useEffect(() => {
    async function filterPosts() {
      let searchFilteredPosts = posts;

      if (searchText.trim()) {
        searchFilteredPosts = searchFilteredPosts.filter((post) =>
          post.title.toLowerCase().includes(searchText.toLowerCase()),
        );
      }

      let finalFilteredPosts = [];

      // Only proceed if userAddress is non-empty
      if (userAddress.trim()) {
        for (let post of searchFilteredPosts) {
          // Try-catch block around distance calculation
          try {
            const distance = await calculateDistance(
              userAddress,
              post.location,
            );
            //console.log({distance, sliderValue}); // additional log for
            // debugging

            if (distance <= sliderValue) {
              finalFilteredPosts.push(post);
              //console.log(post); // additional log for debugging
            }
          } catch (err) {
            console.error(
              `Failed to calculate distance for post with id ${post.id}, error: ${err}`,
            );
          }
        }
      } else {
        console.warn("User address is empty, can not filter by distance.");
        finalFilteredPosts = searchFilteredPosts; // No filtering by distance
        // if no userAddress provided
      }

      setFilteredPosts(finalFilteredPosts);
    }

    filterPosts();
  }, [posts, searchText, sliderValue, userAddress]);

  async function getPostse() {
    const { rows } = await sql`SELECT * FROM Category;`;
    console.log(rows);
  }

  getPostse();

  return (
    <>
      <Box
        sx={{
          gridArea: "main",
        }}
      >
        <Box>
          <Filter sliderValue={sliderValue} setSliderValue={setSliderValue} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-start",
            margin: "2rem auto",
            marginBottom: "1rem",
            maxWidth: {
              xs: "95%",
              sm: "80%",
              md: "70%",
            },
            boxSizing: "border-box",
          }}
        >
          <Typography
            sx={{
              textAlign: "center",
              width: "100%",
              marginBottom: "1rem",
            }}
            variant="h3"
          >
            Annonser
          </Typography>
          {filteredPosts.map((post) => (
            <ActionAreaCard
              key={post.id}
              id={post.id}
              img={post.image}
              title={post.title}
              description={post.description}
              location={post.location}
              price={post.price}
            />
          ))}
        </Box>
      </Box>
    </>
  );
}
