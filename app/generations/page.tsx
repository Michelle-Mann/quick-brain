"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { Container, TextField,  Typography, Box, Grid } from "@mui/material";
import { db } from "@/firebase";
import { collection, doc, getDoc, writeBatch } from "firebase/firestore";
import Preview from "@/components/Preview";
import { TextArea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function Generate() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [text, setText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    try {
      const response = await fetch("/api/flashcards-generations", {
        method: "POST",
        body: text,
      });

      const data = await response.json();
      setFlashcards(data);
    } catch (error) {
      console.error("Error generating flashcards:", error);
    }
  };

  const saveFlashcards = async () => {
    if (!name) {
      alert("Please enter a name for the flashcard set");
      return;
    }

    const batch = writeBatch(db);
    if (user) {
      const userDocRef = doc(collection(db, "users"), user.id);

      try {
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists()) {
          const collections = docSnap.data().flashcards || [];

          if (collections.find((f: any) => f.name === name)) {
            alert("Flashcard set with the same name already exists");
            return;
          } else {
            collections.push({ name });
            batch.set(userDocRef, { flashcards: collections }, { merge: true });
          }
        } else {
          batch.set(userDocRef, { flashcards: [{ name }] });
        }

        const flashcardRef = collection(userDocRef, name);
        flashcards.forEach((flashcard) => {
          const cardDocRef = doc(flashcardRef);
          batch.set(cardDocRef, flashcard);
        });

        await batch.commit();
      } catch (error) {
        console.error("Error getting user document:", error);
      }
    }
  };

  return (
    <Container maxWidth="xl"> 
      <Box
        sx={{
          mt: 4,
          mb: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1 className="mb-2 scroll-m-20 antialiased text-4xl font-bold tracking-tight lg:text-5xl">Generate Flashcards</h1>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to generate flashcards"
          rows={5}
          className="mb-4 ring ring-sky-600 ring-opacity-50 focus:ring-opacity-100 text-base antialiased"
        />
        <Button
          className="bg-sky-700 hover:bg-sky-600 text-white w-1/2"
          onClick={handleSubmit}
        >
          <p className="text-base antialiased">Submit</p>
        </Button>

        {flashcards.length > 0 && (
          <>
            <h2 className="mt-14 mb-2 antialiased text-3xl font-semibold tracking-tight">
              Preview Your Flashcards
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {flashcards.map((flashcard, index) => (
                <div key={index}>
                  <Preview flashcard={flashcard} />
                </div>
              ))}
            </div>
              

            <h3 className="mt-4 mb-2 antialiased text-2xl font-semibold tracking-tight">
              Flashcards generated! Save them below:
            </h3>
            <TextArea
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for the collection"
              className="mb-4 ring ring-violet-600 ring-opacity-50 focus:ring-opacity-100 text-base antialiased"
            />
            <Button
              className="bg-violet-800 hover:b-violet-700 text-white w-1/2"
              onClick={saveFlashcards}
              disabled={!name || !flashcards.length}
            >
              <p className="text-base antialiased">Save Flashcards</p>
            </Button>
          </>
        )}
      </Box>
    </Container>
  );
}