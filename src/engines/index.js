import Choice from './Choice.jsx';
import Count from './Count.jsx';
import Sort from './Sort.jsx';
import Match from './Match.jsx';
import Memory from './Memory.jsx';
import Story from './Story.jsx';
import Trace from './Trace.jsx';
import Coloring from './Coloring.jsx';
import Parent from './Parent.jsx';

// Pour ajouter un nouveau type de jeu : créer un composant { items, activity, onFinish } et l'ajouter ici.
export const engines = { choice: Choice, count: Count, sort: Sort, match: Match, memory: Memory, story: Story, trace: Trace, coloring: Coloring, parent: Parent };

export const engineLabels = {
  choice: 'Questions à choix (images)',
  count: 'Comptage',
  sort: 'Tri dans des boîtes',
  match: 'Association (relier)',
  memory: 'Jeu de mémoire',
  story: 'Histoire + questions',
  trace: 'Tracer / copier',
  coloring: 'Coloriage',
  parent: 'Activité avec le parent / hors écran'
};
