import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Timer, Heart, Brain, CheckCircle2 } from "lucide-react";

export default function CopingTools() {
  const [breathCount, setBreathCount] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [animationFrame, setAnimationFrame] = useState(0);
  
  const [selfCareItems] = useState([
    { id: 1, label: "Drink water" },
    { id: 2, label: "Take a break" },
    { id: 3, label: "Move your body" },
    { id: 4, label: "Connect with someone" },
    { id: 5, label: "Practice mindfulness" },
  ]);

  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  // Load checked items from localStorage on component mount
  useEffect(() => {
    const loadCheckedItems = () => {
      try {
        const storedData = localStorage.getItem('copingToolsCheckedItems');
        
        if (storedData) {
          const { items, timestamp } = JSON.parse(storedData);
          const currentTime = new Date().getTime();
          
          // Check if the data has expired (12 hours = 12 * 60 * 60 * 1000 milliseconds)
          const expirationTime = 12 * 60 * 60 * 1000;
          
          if (currentTime - timestamp < expirationTime) {
            setCheckedItems(items);
          } else {
            // Data has expired, clear it from localStorage
            localStorage.removeItem('copingToolsCheckedItems');
          }
        }
      } catch (error) {
        console.error("Error loading checked items:", error);
        localStorage.removeItem('copingToolsCheckedItems');
      }
    };
    
    loadCheckedItems();
  }, []);

  // Save checked items to localStorage whenever they change
  useEffect(() => {
    const saveCheckedItems = () => {
      try {
        const dataToStore = {
          items: checkedItems,
          timestamp: new Date().getTime()
        };
        
        localStorage.setItem('copingToolsCheckedItems', JSON.stringify(dataToStore));
      } catch (error) {
        console.error("Error saving checked items:", error);
      }
    };
    
    saveCheckedItems();
  }, [checkedItems]);

  // Animation effect for breathing circle
  useEffect(() => {
    const interval = setInterval(() => {
      if (isBreathing) {
        setAnimationFrame(prev => (prev + 1) % 60);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [isBreathing]);

  const startBreathing = () => {
    setIsBreathing(true);
    setBreathCount(0);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsBreathing(false);
          setBreathCount((prev) => prev + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 50);
  };

  const toggleSelfCareItem = (id: number) => {
    setCheckedItems((prev) => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  // Function to reset all checked items
  const resetCheckedItems = () => {
    setCheckedItems([]);
    localStorage.removeItem('copingToolsCheckedItems');
  };

  // Calculate completion percentage for self-care items
  const completionPercentage = (checkedItems.length / selfCareItems.length) * 100;

  // Format time remaining until expiration
  const getTimeRemaining = () => {
    try {
      const storedData = localStorage.getItem('copingToolsCheckedItems');
      
      if (storedData) {
        const { timestamp } = JSON.parse(storedData);
        const currentTime = new Date().getTime();
        const expirationTime = 12 * 60 * 60 * 1000;
        const timeRemaining = expirationTime - (currentTime - timestamp);
        
        if (timeRemaining > 0) {
          const hoursRemaining = Math.floor(timeRemaining / (60 * 60 * 1000));
          const minutesRemaining = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
          return `${hoursRemaining}h ${minutesRemaining}m`;
        }
      }
      
      return "0h 0m";
    } catch (error) {
      return "0h 0m";
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8 text-primary">Wellness Tools</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="relative overflow-hidden shadow-lg border-t-4 border-t-blue-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Timer className="h-6 w-6" />
              Breathing Exercise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Take deep breaths to calm your mind and reduce stress
              </p>
              {isBreathing ? (
                <div className="space-y-6">
                  <div className="relative w-40 h-40 mx-auto">
                    <div 
                      className="absolute inset-0 rounded-full bg-blue-100 flex items-center justify-center transition-all duration-500"
                      style={{ 
                        transform: `scale(${progress <= 50 ? 1 + progress/200 : 2 - progress/100})`,
                        opacity: 0.8
                      }}
                    >
                      <div className="absolute inset-0 rounded-full border-4 border-blue-400 opacity-30"></div>
                      <div className="text-blue-600 font-medium text-lg">
                        {progress <= 50 ? "Inhale" : "Exhale"}
                      </div>
                    </div>
                  </div>
                  <p className="text-lg font-medium text-blue-700">
                    {progress <= 50 ? "Breathe in slowly..." : "Release slowly..."}
                  </p>
                </div>
              ) : (
                <Button 
                  onClick={startBreathing} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Start Breathing Exercise
                </Button>
              )}
              <div className="bg-blue-50 rounded-full p-3 mt-4">
                <p className="text-blue-700 font-medium">
                  Completed cycles: {breathCount}
                </p>
              </div>
            </div>
          </CardContent>
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 -z-10" />
        </Card>

        <Card className="shadow-lg border-t-4 border-t-green-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Daily Self-Care Checklist
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-green-700">Your progress</span>
                  <span className="text-sm font-medium text-green-700">{checkedItems.length}/{selfCareItems.length}</span>
                </div>
                <Progress value={completionPercentage} className="h-2 bg-green-200" />
                {checkedItems.length > 0 && (
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-green-600">Resets in: {getTimeRemaining()}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetCheckedItems}
                      className="text-xs h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200"
                    >
                      Reset
                    </Button>
                  </div>
                )}
              </div>
              {selfCareItems.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 transition-colors">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={checkedItems.includes(item.id)}
                    onCheckedChange={() => toggleSelfCareItem(item.id)}
                    className="border-green-400 text-green-600 h-5 w-5"
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {item.label}
                  </label>
                </div>
              ))}
              {completionPercentage === 100 && (
                <div className="bg-green-100 border border-green-200 p-3 rounded-lg text-center">
                  <p className="text-green-700 font-medium">Amazing job! You've completed all items today.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-purple-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Brain className="h-6 w-6" />
              Reflection Prompts
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <p className="text-sm text-purple-700 font-medium bg-purple-50 p-3 rounded-lg">Today's prompts for mindful reflection:</p>
              <ul className="space-y-3">
                <li className="flex items-start p-3 bg-white rounded-lg shadow-sm border border-purple-100">
                  <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full mr-3">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <p>What made you smile today?</p>
                </li>
                <li className="flex items-start p-3 bg-white rounded-lg shadow-sm border border-purple-100">
                  <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full mr-3">
                    <span className="text-purple-600 font-bold">2</span>
                  </div>
                  <p>Name three things you're grateful for</p>
                </li>
                <li className="flex items-start p-3 bg-white rounded-lg shadow-sm border border-purple-100">
                  <div className="flex-shrink-0 bg-purple-100 p-2 rounded-full mr-3">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <p>What's a small win you can celebrate?</p>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-t-4 border-t-rose-500 hover:shadow-xl transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-rose-600">
              <Heart className="h-6 w-6" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <p className="text-sm font-medium text-rose-700 bg-rose-50 p-3 rounded-lg">When feeling overwhelmed:</p>
              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-rose-100">
                  <div className="flex-shrink-0 mr-3 text-rose-500">❖</div>
                  <p className="text-sm">Ground yourself: Name 5 things you can see</p>
                </div>
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-rose-100">
                  <div className="flex-shrink-0 mr-3 text-rose-500">❖</div>
                  <p className="text-sm">Take a short walk if possible</p>
                </div>
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-rose-100">
                  <div className="flex-shrink-0 mr-3 text-rose-500">❖</div>
                  <p className="text-sm">Listen to calming music</p>
                </div>
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-rose-100">
                  <div className="flex-shrink-0 mr-3 text-rose-500">❖</div>
                  <p className="text-sm">Reach out to a friend or support person</p>
                </div>
                <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-rose-100">
                  <div className="flex-shrink-0 mr-3 text-rose-500">❖</div>
                  <p className="text-sm">Practice self-compassion</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}