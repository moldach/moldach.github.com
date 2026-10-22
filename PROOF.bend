import Base
import ./BendModel.bend as BendModel
import ./LAWS.bend as Laws

def Laws.business_contact():
  {==}

def Laws.hiring_experience():
  {==}

def Laws.blog_preserved():
  {==}

def Laws.no_payments(page):
  match page:
    case BendModel.Contact{}:
      {==}
    case BendModel.Experience{}:
      {==}
    case BendModel.Writing{}:
      {==}

