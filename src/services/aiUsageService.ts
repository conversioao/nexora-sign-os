export interface IImageGenerationProvider {
  generateImage(prompt: string, options: any): Promise<string>; // returns image URL
}

export interface IVideoGenerationProvider {
  generateVideo(prompt: string, options: any): Promise<string>; // returns video URL
}

class MockImageGenerationProvider implements IImageGenerationProvider {
  async generateImage(prompt: string, options: any): Promise<string> {
    // Mock image generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    return `https://source.unsplash.com/random/800x600/?${encodeURIComponent(prompt.split(' ')[0])},advertising`;
  }
}

class MockVideoGenerationProvider implements IVideoGenerationProvider {
  async generateVideo(prompt: string, options: any): Promise<string> {
    // Mock video generation delay
    await new Promise(resolve => setTimeout(resolve, 4000));
    return 'https://www.w3schools.com/html/mov_bbb.mp4';
  }
}

export const imageGenerationProvider = new MockImageGenerationProvider();
export const videoGenerationProvider = new MockVideoGenerationProvider();

export class AIUsageService {
  private static credits = 1000;

  static async getBalance(): Promise<number> {
    return this.credits;
  }

  static async consumeCredits(amount: number): Promise<boolean> {
    if (this.credits >= amount) {
      this.credits -= amount;
      return true;
    }
    return false;
  }

  static getCostForImage(): number {
    return 10;
  }

  static getCostForVideo(): number {
    return 50;
  }
}
