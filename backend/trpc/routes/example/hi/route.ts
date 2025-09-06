import { publicProcedure } from "../../../create-context";

// Export a simple query procedure directly
export default publicProcedure
  .query(() => {
    console.log('👋 Hi query called');
    return {
      message: 'Hello from backend!',
      timestamp: new Date(),
      status: 'Backend is working'
    };
  });