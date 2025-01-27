"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Container, Box, Typography } from "@mui/material";
import { collection, doc, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import Flashcard from "@/components/Flashcard";
import { Button } from "@/components/ui/button";

interface FlashcardProps {
  flashcard: {
    front: string;
    back: string;
  };
}

interface FlashcardsPageProps {
  params: {
    collectionName: string;
  };
}

export default function FlashcardsPage({ params }: FlashcardsPageProps) {
  const { collectionName } = params;
  const [flashcards, setFlashcards] = useState<FlashcardProps["flashcard"][]>(
    []
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (!collectionName || !user) return;

      try {
        const userDocRef = doc(collection(db, "users"), user.id);
        const colRef = collection(userDocRef, collectionName);
        const colSnap = await getDocs(colRef);

        const flashcardsData: FlashcardProps["flashcard"][] = colSnap.docs.map(
          (doc) => {
            const data = doc.data();
            return {
              front: data.front || "",
              back: data.back || "",
            };
          }
        );

        console.log("Flashcards data:", flashcardsData);
        setFlashcards(flashcardsData);
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      }
    };

    fetchFlashcards();
  }, [collectionName, user]);

  const handleNext = () => {
    setCurrentCardIndex((prevIndex) => (prevIndex + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setCurrentCardIndex(
      (prevIndex) => (prevIndex - 1 + flashcards.length) % flashcards.length
    );
  };

  return (
    <div className="w-full">
      <Box
        sx={{
          mt: 4,
          mb: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {flashcards.length > 0 ? (
          <>
            <div className="grid grid-flow-col gap-10 mt-10">
              <div className="flex justify-center items-center">
                <Button
                  variant="default"
                  color="primary"
                  size="lg"
                  onClick={handlePrevious}
                  disabled={currentCardIndex === 0}
                >
                  {"<"}
                </Button>
              </div>
              <Flashcard flashcard={flashcards[currentCardIndex]} />
              <div className="flex justify-center items-center">
                <Button
                  variant="default"
                  color="primary"
                  size="lg"
                  onClick={handleNext}
                  disabled={currentCardIndex === flashcards.length - 1}
                >
                  {">"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <Typography variant="h6">
            No flashcards found in this collection.
          </Typography>
        )}
      </Box>
    </div>
  );
}
