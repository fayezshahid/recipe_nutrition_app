import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IngredientService } from '../../services/ingredients/ingredient';

@Component({
  selector: 'app-add-ingredient-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-ingredient-modal.component.html',
  styleUrl: './add-ingredient-modal.component.css',
})
export class AddIngredientModalComponent implements OnChanges {
  @Input() showModal: boolean = false;
  @Input() ingredientName: string = '';
  @Output() closeModal = new EventEmitter<void>();
  @Output() ingredientAdded = new EventEmitter<any>();

  newIngredientData = {
    name: '',
    protein: 0,
    carbs: 0,
    fat: 0
  };

  isSubmittingNewIngredient = false;

  constructor(private ingredientService: IngredientService) {}

  ngOnChanges() {
    if (this.showModal && this.ingredientName) {
      this.newIngredientData.name = this.ingredientName;
    }
  }

  onCloseModal() {
    this.closeModal.emit();
    this.resetForm();
  }

  isIngredientDataValid(): boolean {
    return this.newIngredientData.name.trim() !== '' &&
           (this.newIngredientData.protein > 0 || 
            this.newIngredientData.carbs > 0 || 
            this.newIngredientData.fat > 0);
  }

  async onSubmitNewIngredient() {
    if (!this.isIngredientDataValid() || this.isSubmittingNewIngredient) {
      return;
    }

    this.isSubmittingNewIngredient = true;

    try {
      const result = await this.ingredientService.addIngredient(this.newIngredientData);
      this.ingredientAdded.emit(result);
      this.onCloseModal();
    } catch (error) {
      console.error('Error adding ingredient:', error);
      // Handle error (show notification, etc.)
    } finally {
      this.isSubmittingNewIngredient = false;
    }
  }

  private resetForm() {
    this.newIngredientData = {
      name: '',
      protein: 0,
      carbs: 0,
      fat: 0
    };
    this.isSubmittingNewIngredient = false;
  }
}