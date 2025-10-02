"use client"

import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  CloudCheck,
  Loader2,
  LucideMoveRight,
  Upload,
  User2Icon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Highlighter } from "@/components/magicui/highlighter";
import { RainbowButton } from "@/components/magicui/rainbow-button";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { toast } from "sonner";
import AITextLoading from "@/components/kokonutui/ai-text-loading";
import { useRouter } from "next/navigation";

export default function UploadStep() {
  const [file, setFile] = useState<File | null>(null);
  const [nextStep, setNextStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [hasVectors, setHasVectors] = useState(false);
  const router = useRouter();

  // read localStorage only on client
  useEffect(() => {
    const flag =
      typeof window !== "undefined" &&
      localStorage.getItem("pdfAdded") === "true";
    setHasVectors(flag);
  }, []);

  const handleUpload = async () => {
    if (!file) return toast.error("Please upload a PDF");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("/api/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // console.log("Upload result:", res.data);
      localStorage.setItem("pdfAdded", "true");
      setHasVectors(true);
      setUploaded(true);
      toast.success("PDF processed & vectors stored in Pinecone");
    } catch (err) {
      console.error("Upload failed:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      setDeleteLoading(true);
      const res = await axios.post("/api/delete");
      if (res.data.success) {
        toast.success("All vectors deleted successfully!");
        localStorage.removeItem("pdfAdded");
        setHasVectors(false);
      } else {
        toast.error("Failed to delete vectors.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Server error while deleting.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
          radial-gradient(circle at 50% 100%, rgba(70, 85, 110, 0.5) 0%, transparent 60%),
          radial-gradient(circle at 50% 100%, rgba(99, 102, 241, 0.4) 0%, transparent 70%),
          radial-gradient(circle at 50% 100%, rgba(181, 184, 208, 0.3) 0%, transparent 80%)
        `,
        }}
      />
      <main className="z-10 w-full max-w-[600px]">
        {nextStep === 1 && (
          <Card className=" bg-white text-black rounded-2xl shadow-xl border border-gray-200">
            <CardHeader className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-4 justify-center font-sora">
                Welcome, Anonymous <User2Icon />
              </h1>
              <p className="text-xl text-gray-800 font-medium  font-inter whitespace-nowrap">
                The{" "}
                <Highlighter action="underline" color="#FF9800">
                  Hybrid Contextual
                </Highlighter>{" "}
                AI Agent for {"  "}
                <Highlighter action="highlight" color="#87CEFA">
                  Research & Education
                </Highlighter>{" "}
              </p>
              <Separator className="mt-3 mb-2" />
            </CardHeader>

            <CardContent>
              <div className=" flex flex-col items-center justify-center">
                <Label className="font-inter text-base text-muted-foreground">
                  Enter 2-3 lines to describe what you want your AI agent to be?
                </Label>
                <Textarea
                  rows={4}
                  className="bg-gray-100 resize-none mt-3"
                  placeholder="You will become specialist in ..."
                ></Textarea>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center ">
              <RainbowButton
                variant="default"
                className="px-6"
                onClick={() => setNextStep(2)}
              >
                Next <LucideMoveRight />
              </RainbowButton>
            </CardFooter>
          </Card>
        )}

        {nextStep === 2 && (
          <Card className=" bg-white text-black rounded-2xl shadow-xl border border-gray-200">
            <CardHeader className="text-center space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-4 justify-center font-sora">
                Welcome, Anonymous <User2Icon />
              </h1>
              <p className="text-xl text-gray-800 font-medium font-inter">
                The{" "}
                <Highlighter action="underline" color="#FF9800">
                  Hybrid Contextual
                </Highlighter>{" "}
                AI Agent for {"  "}
                <Highlighter action="highlight" color="#87CEFA">
                  Research & Education
                </Highlighter>{" "}
              </p>
              <Separator className="mt-3 mb-2" />
            </CardHeader>

            <CardContent>
              <div className=" flex flex-col items-center justify-center ">
                <Label className="font-inter text-base text-muted-foreground">
                  Upload PDF
                </Label>
                <div className="flex items-center w-full mt-5 gap-5">
                  <Input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="bg-gray-100 cursor-pointer"
                  />
                  <Button
                    variant="outline"
                    onClick={handleUpload}
                    disabled={loading || uploaded}
                  >
                    {loading ? (
                      <>
                        Uploading <Loader2 className="ml-2 animate-spin" />
                      </>
                    ) : (
                      <>
                        Upload <Upload className="ml-2" />
                      </>
                    )}
                  </Button>
                  {hasVectors && (
                    <Button variant="destructive" onClick={handleClear}>
                      {" "}
                      {deleteLoading ? (
                        <>
                          Deleting <Loader2 className="ml-2 animate-spin" />
                        </>
                      ) : (
                        <>
                          Delete <X className="ml-2" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
              {loading && <AITextLoading />}
            </CardContent>

            <CardFooter className="flex justify-center ">
              <RainbowButton variant="default" className="px-6" onClick={()=>router.push('/ask-agent')}>
                Continue <LucideMoveRight />
              </RainbowButton>
            </CardFooter>
          </Card>
        )}
      </main>
    </div>
  );
}
