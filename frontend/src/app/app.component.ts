import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { IngredientService } from './services/ingredients/ingredient';
import { RecipeService, RecipePayload } from './services/recipes/recipe';
import { RecipeFormComponent } from './components/recipe-form/recipe-form.component'; 
import { NutritionDisplayComponent } from './components/nutrition-display/nutrition-display.component';
import { RecipeListComponent } from './components/recipe-list/recipe-list.component';
import { AddIngredientModalComponent } from './components/add-ingredient-modal/add-ingredient-modal.component';

interface Recipe {
  id?: number;
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
  imports: [
    CommonModule, 
    FormsModule,
    RecipeFormComponent,
    NutritionDisplayComponent,
    RecipeListComponent,
    AddIngredientModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class App {
  // State management
  savedRecipes: Recipe[] = [];
  editingRecipe: Recipe | null = null;
  editingIndex: number = -1;
  nutritionData: NutritionData | null = null;
  
  // Cache to store nutrition data for each ingredient
  private nutritionCache: Map<string, NutritionData> = new Map();

  // Modal state
  showAddIngredientModal: boolean = false;
  modalIngredientName: string = '';

  constructor(
    private ingredientService: IngredientService,
    private recipeService: RecipeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSavedRecipes();
  }

  // ============ RECIPE MANAGEMENT ============

  onSaveRecipe(recipeData: { title: string; ingredients: string[]; steps: string[] }): void {
    const recipePayload: RecipePayload = {
      title: recipeData.title.trim(),
      ingredients: recipeData.ingredients.map(name => ({ name, quantity: '1 unit' })),
      steps: recipeData.steps.map((description, index) => ({
        description,
        step_number: index + 1
      }))
    };

    if (this.editingRecipe && this.editingRecipe.id) {
      this.recipeService.update(this.editingRecipe.id, recipePayload).subscribe({
        next: (updatedRecipe) => {
          this.savedRecipes[this.editingIndex] = {
            ...updatedRecipe,
            ingredients: updatedRecipe.ingredients.map((ing: any) => ing.name),
            steps: updatedRecipe.steps.map((step: any) => step.description),
          };
          this.clearEditingState();
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
          this.clearEditingState();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to save recipe to backend:', err);
        }
      });
    }
  }

  onEditRecipe(data: { recipe: Recipe; index: number }): void {
    this.editingRecipe = { ...data.recipe };
    this.editingIndex = data.index;
    this.recalculateNutritionData(data.recipe.ingredients);
  }

  onDeleteRecipe(index: number): void {
    const recipe = this.savedRecipes[index];
    if (!recipe || !recipe.id) return;

    if (confirm('Are you sure you want to delete this recipe?')) {
      this.recipeService.delete(recipe.id).subscribe({
        next: () => {
          this.savedRecipes.splice(index, 1);
          if (this.editingIndex === index) {
            this.clearEditingState();
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

  onClearForm(): void {
    this.clearEditingState();
    this.nutritionData = null;
    this.nutritionCache.clear();
  }

  // ============ NUTRITION MANAGEMENT ============

  onIngredientsChanged(ingredients: string[]): void {
    this.recalculateNutritionData(ingredients);
  }

  private recalculateNutritionData(ingredients: string[]): void {
    if (ingredients.length === 0) {
      this.nutritionData = null;
      this.cdr.detectChanges();
      return;
    }

    this.nutritionData = { protein: 0, carbs: 0, fat: 0 };
    
    ingredients.forEach((ingredient) => {
      this.ingredientService.getIngredientByName(ingredient).subscribe({
        next: (data) => {
          if (data && (data.protein || data.carbs || data.fat)) {
            const nutrition = {
              protein: Number(data.protein) || 0,
              carbs: Number(data.carbs) || 0,
              fat: Number(data.fat) || 0,
            };
            
            this.nutritionCache.set(ingredient, nutrition);
            
            if (this.nutritionData) {
              this.nutritionData.protein = Math.round((this.nutritionData.protein + nutrition.protein) * 100) / 100;
              this.nutritionData.carbs = Math.round((this.nutritionData.carbs + nutrition.carbs) * 100) / 100;
              this.nutritionData.fat = Math.round((this.nutritionData.fat + nutrition.fat) * 100) / 100;
            }
            
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Failed to fetch nutrition data for', ingredient, err);
        }
      });
    });
  }

  // ============ INGREDIENT MODAL ============

  onIngredientNotFound(ingredientName: string): void {
    this.modalIngredientName = ingredientName;
    this.showAddIngredientModal = true;
  }

  onCloseModal(): void {
    this.showAddIngredientModal = false;
    this.modalIngredientName = '';
  }

  onIngredientAdded(ingredientData: { name: string; protein: number; carbs: number; fat: number }): void {
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
    
    this.showAddIngredientModal = false;
    this.modalIngredientName = '';
    this.cdr.detectChanges();
  }

  // ============ PRIVATE METHODS ============

  private clearEditingState(): void {
    this.editingRecipe = null;
    this.editingIndex = -1;
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
}