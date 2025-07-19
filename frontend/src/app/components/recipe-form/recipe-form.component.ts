import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngredientService } from '../../services/ingredients/ingredient';

interface Recipe {
  id?: number;
  title: string;
  ingredients: string[];
  steps: string[];
}

@Component({
  selector: 'app-recipe-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recipe-form.component.html',
  styleUrl: './recipe-form.component.css'
})
export class RecipeFormComponent implements OnInit, OnDestroy {
  @Input() editingRecipe: Recipe | null = null;
  @Output() saveRecipe = new EventEmitter<{ title: string; ingredients: string[]; steps: string[] }>();
  @Output() clearForm = new EventEmitter<void>();
  @Output() ingredientsChanged = new EventEmitter<string[]>();
  @Output() ingredientNotFound = new EventEmitter<string>();

  // Form data
  recipeForm: Recipe = {
    title: '',
    ingredients: [],
    steps: []
  };

  // Input fields
  newIngredient: string = '';
  newStep: string = '';

  // Local storage keys
  private readonly FORM_DATA_KEY = 'recipe_form_data';
  private readonly INPUTS_KEY = 'recipe_inputs';

  // Auto-save interval
  private autoSaveInterval: any;

  constructor(private ingredientService: IngredientService) {}

  ngOnInit(): void {
    this.loadPersistedData();
    this.startAutoSave();
    
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

  ngOnChanges(): void {
    if (this.editingRecipe) {
      this.recipeForm = {
        title: this.editingRecipe.title,
        ingredients: [...this.editingRecipe.ingredients],
        steps: [...this.editingRecipe.steps]
      };
      this.persistFormData();
    }
  }

  // ============ FORM MANAGEMENT ============
  
  addIngredient(): void {
    const trimmedIngredient = this.newIngredient.trim();
    if (!trimmedIngredient) return;

    this.ingredientService.getIngredientByName(trimmedIngredient).subscribe({
      next: (data) => {
        if (!data || (!data.protein && !data.carbs && !data.fat)) {
          this.ingredientNotFound.emit(trimmedIngredient);
        }
        
        this.recipeForm.ingredients.push(trimmedIngredient);
        this.ingredientsChanged.emit([...this.recipeForm.ingredients]);
        this.persistFormData();
      },
      error: (err) => {
        console.error('Error fetching nutrition info:', err);
        this.ingredientNotFound.emit(trimmedIngredient);
        this.recipeForm.ingredients.push(trimmedIngredient);
        this.ingredientsChanged.emit([...this.recipeForm.ingredients]);
        this.persistFormData();
      }
    });

    this.newIngredient = '';
  }

  removeIngredient(index: number): void {
    this.recipeForm.ingredients.splice(index, 1);
    this.ingredientsChanged.emit([...this.recipeForm.ingredients]);
    this.persistFormData();
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

  onSaveRecipe(): void {
    if (this.isFormValid()) {
      this.saveRecipe.emit({
        title: this.recipeForm.title,
        ingredients: [...this.recipeForm.ingredients],
        steps: [...this.recipeForm.steps]
      });
      this.resetForm();
    }
  }

  onClearForm(): void {
    this.resetForm();
    this.clearForm.emit();
  }

  private resetForm(): void {
    this.recipeForm = {
      title: '',
      ingredients: [],
      steps: []
    };
    this.newIngredient = '';
    this.newStep = '';
    this.persistFormData();
    this.clearPersistedInputs();
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

  // ============ PERSISTENCE ============

  persistFormData(): void {
    const formData = {
      recipeForm: this.recipeForm
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

  private initializeEmptyForm(): void {
    this.recipeForm = {
      title: '',
      ingredients: [],
      steps: []
    };
    this.newIngredient = '';
    this.newStep = '';
  }

  private startAutoSave(): void {
    this.autoSaveInterval = setInterval(() => {
      this.persistFormData();
    }, 10000);
  }
}