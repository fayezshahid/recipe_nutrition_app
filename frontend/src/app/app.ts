import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { IngredientService } from './services/ingredients/ingredient';
import { RecipeService, RecipePayload  } from './services/recipes/recipe';

interface Recipe {
  id?: number; // Optional ID for backend integration
  title: string;
  ingredients: string[];
  steps: string[];
}

interface NutritionData {
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // Form data
  recipeForm: Recipe = {
    title: '',
    ingredients: [],
    steps: []
  };

  // Input fields
  newIngredient: string = '';
  newStep: string = '';

  // State management
  savedRecipes: Recipe[] = [];
  editingRecipe: Recipe | null = null;
  editingIndex: number = -1;
  nutritionData: NutritionData | null = null;
  
  // Cache to store nutrition data for each ingredient
  private nutritionCache: Map<string, NutritionData> = new Map();

  // Modal state for adding new ingredients
  showAddIngredientModal: boolean = false;
  newIngredientData = {
    name: '',
    protein: 0,
    carbs: 0,
    fat: 0
  };
  isSubmittingNewIngredient: boolean = false;

  // Local storage keys
  private readonly FORM_DATA_KEY = 'recipe_form_data';
  private readonly RECIPES_KEY = 'saved_recipes';
  private readonly INPUTS_KEY = 'recipe_inputs';

  // Auto-save interval
  private autoSaveInterval: any;

  constructor(
    private ingredientService: IngredientService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPersistedData();
    this.loadSavedRecipes();
    this.startAutoSave();

    // this.loadAllIngredients();
    
    // Listen for page visibility changes to persist data
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistFormData();
      }
    });

    // Listen for beforeunload to persist data before page closes
    window.addEventListener('beforeunload', () => {
      this.persistFormData();
    });
  }

  ngOnDestroy(): void {
    this.persistFormData();
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
  }

  loadAllIngredients(): void {
    this.ingredientService.getAllIngredients().subscribe({
      next: (data) => {
        console.log('Ingredients loaded:', data);
      },
      error: (err) => {
        console.error('Error loading ingredients:', err);
      }
    });
  }

  // ============ FORM MANAGEMENT ============
  
  addIngredient(): void {
    const trimmedIngredient = this.newIngredient.trim();
    if (!trimmedIngredient) return;

    this.ingredientService.getIngredientByName(trimmedIngredient).subscribe({
      next: (data) => {
        if (!data || (!data.protein && !data.carbs && !data.fat)) {
          this.openAddIngredientModal(trimmedIngredient);  // Show modal to manually enter data
        } else {
          this.addIngredientWithNutrition(trimmedIngredient, {
            protein: Number(data.protein) || 0,
            carbs: Number(data.carbs) || 0,
            fat: Number(data.fat) || 0
          });
        }
      },
      error: (err) => {
        console.error('Error fetching nutrition info:', err);
        this.openAddIngredientModal(trimmedIngredient);
      }
    });

    this.newIngredient = '';  // Clear input field immediately
  }

  private addIngredientWithNutrition(ingredient: string, nutrition: NutritionData): void {
    this.recipeForm.ingredients.push(ingredient);
    this.nutritionCache.set(ingredient, nutrition);

    if (!this.nutritionData) {
      this.nutritionData = { protein: 0, carbs: 0, fat: 0 };
    }

    this.nutritionData.protein = Math.round((this.nutritionData.protein + nutrition.protein) * 100) / 100;
    this.nutritionData.carbs = Math.round((this.nutritionData.carbs + nutrition.carbs) * 100) / 100;
    this.nutritionData.fat = Math.round((this.nutritionData.fat + nutrition.fat) * 100) / 100;

    this.persistFormData();
    this.cdr.detectChanges();
  }

  removeIngredient(index: number): void {
    if(this.editingRecipe){
      this.recalculateNutritionData();
    }

    const removedIngredient = this.recipeForm.ingredients[index];
    
    // Subtract nutrition values before removing the ingredient
    if (this.nutritionData && this.nutritionCache.has(removedIngredient)) {
      const removedNutrition = this.nutritionCache.get(removedIngredient)!;
      
      this.nutritionData.protein = Math.max(0, Math.round((this.nutritionData.protein - removedNutrition.protein) * 100) / 100);
      this.nutritionData.carbs = Math.max(0, Math.round((this.nutritionData.carbs - removedNutrition.carbs) * 100) / 100);
      this.nutritionData.fat = Math.max(0, Math.round((this.nutritionData.fat - removedNutrition.fat) * 100) / 100);
      
      console.log(`Removed nutrition for ${removedIngredient}:`, removedNutrition);
      console.log('Updated total nutrition:', this.nutritionData);
    }
    
    this.recipeForm.ingredients.splice(index, 1);
    this.persistFormData();
    
    // Clear nutrition data if no ingredients left
    if (this.recipeForm.ingredients.length === 0) {
      this.nutritionData = null;
    }
    
    this.cdr.detectChanges();
  }

  addStep(): void {
    if (this.newStep.trim()) {
      this.recipeForm.steps.push(this.newStep.trim());
      this.newStep = '';
      this.persistFormData();
    }
  }

  removeStep(index: number): void {
    this.recipeForm.steps.splice(index, 1);
    this.persistFormData();
  }

  onIngredientKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.addIngredient();
    }
  }

  clearForm(): void {
    this.recipeForm = {
      title: '',
      ingredients: [],
      steps: []
    };
    this.newIngredient = '';
    this.newStep = '';
    this.editingRecipe = null;
    this.editingIndex = -1;
    this.nutritionData = null;
    this.nutritionCache.clear(); // Clear the nutrition cache
    this.persistFormData();
    this.clearPersistedInputs();
    this.cdr.detectChanges(); // Trigger change detection
  }

  isFormValid(): boolean {
    return this.recipeForm.title.trim() !== '' && 
           this.recipeForm.ingredients.length > 0 && 
           this.recipeForm.steps.length > 0;
  }

  isFormEmpty(): boolean {
    return this.recipeForm.title.trim() === '' && 
           this.recipeForm.ingredients.length === 0 && 
           this.recipeForm.steps.length === 0 &&
           this.newIngredient.trim() === '' &&
           this.newStep.trim() === '';
  }

  // ============ RECIPE MANAGEMENT ============

  saveRecipe(): void {
    if (!this.isFormValid()) return;

    const recipePayload: RecipePayload = {
      title: this.recipeForm.title.trim(),
      ingredients: this.recipeForm.ingredients.map(name => ({ name, quantity: '1 unit' })),
      steps: this.recipeForm.steps.map((description, index) => ({
        description,
        step_number: index + 1
      }))
    };

    // If editing, call update instead of create
    if (this.editingRecipe && this.editingRecipe.id) {
      this.recipeService.update(this.editingRecipe.id, recipePayload).subscribe({
        next: (updatedRecipe) => {
          this.savedRecipes[this.editingIndex] = {
            ...updatedRecipe,
            ingredients: updatedRecipe.ingredients.map((ing: any) => ing.name),
            steps: updatedRecipe.steps.map((step: any) => step.description),
          };
          this.clearForm();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to update recipe:', err);
        }
      });
    } else {
      this.recipeService.create(recipePayload).subscribe({
        next: (createdRecipe) => {
          const normalized = {
            ...createdRecipe,
            ingredients: createdRecipe.ingredients.map((ing: any) => ing.name),
            steps: createdRecipe.steps.map((step: any) => step.description),
          };

          this.savedRecipes.push(normalized);
          this.clearForm();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to save recipe to backend:', err);
        }
      });
    }
  }


  editRecipe(recipe: any, index: number): void {
    this.editingRecipe = { ...recipe };
    this.editingIndex = index;

    this.recipeForm = {
      title: recipe.title,
      ingredients: [...recipe.ingredients],
      steps: [...recipe.steps]             
    };

    this.persistFormData();
    this.recalculateNutritionData();
  }


  deleteRecipe(index: number): void {
    const recipe = this.savedRecipes[index];
    if (!recipe || !recipe.id) return;

    if (confirm('Are you sure you want to delete this recipe?')) {
      this.recipeService.delete(recipe.id).subscribe({
        next: () => {
          this.savedRecipes.splice(index, 1);
          if (this.editingIndex === index) {
            this.clearForm();
          } else if (this.editingIndex > index) {
            this.editingIndex--;
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to delete recipe from backend:', err);
        }
      });
    }
  }

  // ============ PERSISTENCE ============

  persistFormData(): void {
    const formData = {
      recipeForm: this.recipeForm,
      editingRecipe: this.editingRecipe,
      editingIndex: this.editingIndex
    };
    
    const inputData = {
      newIngredient: this.newIngredient,
      newStep: this.newStep
    };

    try {
      localStorage.setItem(this.FORM_DATA_KEY, JSON.stringify(formData));
      localStorage.setItem(this.INPUTS_KEY, JSON.stringify(inputData));
    } catch (error) {
      console.warn('Failed to persist form data:', error);
    }
  }

  private loadPersistedData(): void {
    try {
      // Load form data
      const formDataStr = localStorage.getItem(this.FORM_DATA_KEY);
      if (formDataStr) {
        const formData = JSON.parse(formDataStr);
        this.recipeForm = formData.recipeForm || { title: '', ingredients: [], steps: [] };
        this.editingRecipe = formData.editingRecipe || null;
        this.editingIndex = formData.editingIndex || -1;
        
        // Update nutrition data if ingredients exist
        if (this.recipeForm.ingredients.length > 0) {
          this.recalculateNutritionData();
        }
      }

      // Load input data
      const inputDataStr = localStorage.getItem(this.INPUTS_KEY);
      if (inputDataStr) {
        const inputData = JSON.parse(inputDataStr);
        this.newIngredient = inputData.newIngredient || '';
        this.newStep = inputData.newStep || '';
      }
    } catch (error) {
      console.warn('Failed to load persisted data:', error);
      this.initializeEmptyForm();
    }
  }

  private clearPersistedInputs(): void {
    try {
      localStorage.removeItem(this.INPUTS_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted inputs:', error);
    }
  }

  private saveRecipesToStorage(): void {
    try {
      localStorage.setItem(this.RECIPES_KEY, JSON.stringify(this.savedRecipes));
    } catch (error) {
      console.warn('Failed to save recipes:', error);
    }
  }

  private loadSavedRecipes(): void {
    this.recipeService.getAll().subscribe({
      next: (recipesFromApi: any[]) => {
        this.savedRecipes = recipesFromApi.map((recipe: any) => ({
          ...recipe,
          ingredients: recipe.ingredients.map((ing: any) => ing.name),
          steps: recipe.steps.map((step: any) => step.description),
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to load recipes from backend:', err);
        this.savedRecipes = [];
      }
    });
  }


  private initializeEmptyForm(): void {
    this.recipeForm = {
      title: '',
      ingredients: [],
      steps: []
    };
    this.newIngredient = '';
    this.newStep = '';
    this.editingRecipe = null;
    this.editingIndex = -1;
  }

  private startAutoSave(): void {
    // Auto-save every 10 seconds
    this.autoSaveInterval = setInterval(() => {
      this.persistFormData();
    }, 10000);
  }

  // ============ NUTRITION API ============

  private updateNutritionData(): void {
    if (this.recipeForm.ingredients.length > 0) {
      // Get the last added ingredient
      const lastIngredient = this.recipeForm.ingredients[this.recipeForm.ingredients.length - 1];
      this.addNutritionForIngredient(lastIngredient);
    } else {
      this.nutritionData = null;
      this.cdr.detectChanges(); // Trigger change detection
    }
  }

  private addNutritionForIngredient(ingredient: string): void {
    console.log('Fetching nutrition data for:', ingredient);

    this.ingredientService.getIngredientByName(ingredient).subscribe({
      next: (data) => {
        if (!data || !data.protein && !data.carbs && !data.fat) {
          // No nutrition data found, open modal
          this.openAddIngredientModal(ingredient);
          return; // stop further processing
        }
        
        const nutrition = {
          protein: Number(data.protein) || 0,
          carbs: Number(data.carbs) || 0,
          fat: Number(data.fat) || 0,
        };
        
        // Cache the nutrition data for this ingredient
        this.nutritionCache.set(ingredient, nutrition);
        
        // Initialize nutrition data if it doesn't exist
        if (!this.nutritionData) {
          this.nutritionData = { protein: 0, carbs: 0, fat: 0 };
        }

        // Add the new ingredient's nutrition to the total
        this.nutritionData.protein = Math.round((this.nutritionData.protein + nutrition.protein) * 100) / 100;
        this.nutritionData.carbs = Math.round((this.nutritionData.carbs + nutrition.carbs) * 100) / 100;
        this.nutritionData.fat = Math.round((this.nutritionData.fat + nutrition.fat) * 100) / 100;

        console.log('Updated total nutrition:', this.nutritionData);
        
        // Trigger change detection manually
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to fetch nutrition data for', ingredient, err);

        // Open modal to add new ingredient
        this.openAddIngredientModal(ingredient);
      }
    });
  }

  private recalculateNutritionData(): void {
    console.log('Recalculating nutrition data for all ingredients...');
    if (this.recipeForm.ingredients.length === 0) {
      this.nutritionData = null;
      this.cdr.detectChanges(); // Trigger change detection
      return;
    }

    // Reset nutrition data
    this.nutritionData = { protein: 0, carbs: 0, fat: 0 };
    let completedRequests = 0;
    const totalIngredients = this.recipeForm.ingredients.length;
    
    // Fetch nutrition for each ingredient
    this.recipeForm.ingredients.forEach((ingredient, index) => {
      this.ingredientService.getIngredientByName(ingredient).subscribe({
        next: (data) => {
          const nutrition = {
            protein: Number(data.protein) || 0,
            carbs: Number(data.carbs) || 0,
            fat: Number(data.fat) || 0,
          };
          
          if (this.nutritionData) {
            this.nutritionData.protein = Math.round((this.nutritionData.protein + nutrition.protein) * 100) / 100;
            this.nutritionData.carbs = Math.round((this.nutritionData.carbs + nutrition.carbs) * 100) / 100;
            this.nutritionData.fat = Math.round((this.nutritionData.fat + nutrition.fat) * 100) / 100;
          }
          
          completedRequests++;
          console.log(`Added nutrition for ${ingredient}:`, nutrition);
          console.log('Running total:', this.nutritionData);
          
          // Trigger change detection after each update
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to fetch nutrition data for', ingredient, err);
          completedRequests++;
          
          // Still trigger change detection even on error
          this.cdr.detectChanges();
        }
      });
    });
  }

   // ============ ADD INGREDIENT MODAL ============
  
  openAddIngredientModal(ingredientName: string): void {
    this.newIngredientData = {
      name: ingredientName,
      protein: 0,
      carbs: 0,
      fat: 0
    };
    this.showAddIngredientModal = true;
    this.cdr.detectChanges();
  }
  
  closeAddIngredientModal(): void {
    this.showAddIngredientModal = false;
    this.newIngredientData = {
      name: '',
      protein: 0,
      carbs: 0,
      fat: 0
    };
    this.isSubmittingNewIngredient = false;
    this.cdr.detectChanges();
  }
  
  submitNewIngredient(): void {
    if (!this.newIngredientData.name.trim()) {
      alert('Ingredient name is required.');
      return;
    }

    this.isSubmittingNewIngredient = true;

    const ingredientData = {
      name: this.newIngredientData.name.trim(),
      carbs: Number(this.newIngredientData.carbs) || 0,
      fat: Number(this.newIngredientData.fat) || 0,
      protein: Number(this.newIngredientData.protein) || 0
    };

    // Validation: No value should be 0
    if (
      ingredientData.protein <= 0 ||
      ingredientData.carbs <= 0 ||
      ingredientData.fat <= 0
    ) {
      // alert('All nutritional values (protein, carbs, fat) must be greater than 0.');
      this.isSubmittingNewIngredient = false;
      return;
    }

    this.ingredientService.addIngredient(ingredientData).subscribe({
      next: (response) => {
        console.log('New ingredient added successfully:', response);

        const nutrition = {
          protein: ingredientData.protein,
          carbs: ingredientData.carbs,
          fat: ingredientData.fat
        };
        this.nutritionCache.set(ingredientData.name, nutrition);

        if (!this.nutritionData) {
          this.nutritionData = { protein: 0, carbs: 0, fat: 0 };
        }

        this.nutritionData.protein = Math.round((this.nutritionData.protein + nutrition.protein) * 100) / 100;
        this.nutritionData.carbs = Math.round((this.nutritionData.carbs + nutrition.carbs) * 100) / 100;
        this.nutritionData.fat = Math.round((this.nutritionData.fat + nutrition.fat) * 100) / 100;

        console.log('Updated total nutrition after adding new ingredient:', this.nutritionData);

        this.addIngredientWithNutrition(ingredientData.name, nutrition);

        this.closeAddIngredientModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to add new ingredient:', err);
        this.isSubmittingNewIngredient = false;
        this.cdr.detectChanges();
      }
    });
  }

  isIngredientDataValid(): boolean {
  const { protein, carbs, fat } = this.newIngredientData;
  return (
    Number(protein) > 0 &&
    Number(carbs) > 0 &&
    Number(fat) > 0
  );
}

}