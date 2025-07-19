import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Recipe {
  id?: number;
  title: string;
  ingredients: string[];
  steps: string[];
}

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './recipe-list.component.html',
  styleUrl: './recipe-list.component.css'
})
export class RecipeListComponent {
  @Input() savedRecipes: Recipe[] = [];
  @Output() editRecipe = new EventEmitter<{ recipe: Recipe; index: number }>();
  @Output() deleteRecipe = new EventEmitter<number>();

  onEditRecipe(recipe: Recipe, index: number): void {
    this.editRecipe.emit({ recipe, index });
  }

  onDeleteRecipe(index: number): void {
    this.deleteRecipe.emit(index);
  }
}