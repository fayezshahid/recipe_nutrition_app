import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NutritionData {
  protein: number;
  carbs: number;
  fat: number;
}

@Component({
  selector: 'app-nutrition-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nutrition-display.component.html',
  styleUrl: './nutrition-display.component.css'
})
export class NutritionDisplayComponent {
  @Input() nutritionData: NutritionData | null = null;
  @Input() showNutrition: boolean = false;
}