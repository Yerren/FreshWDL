# Clientraw files: space-separated fields, read by position.
import Base

def fix(+f: String) -> String:
  Bool.pick(String, String.eq(f, "-"), "0", f)

def split.acc(+cut: Bool, +cur: String, +acc: List<&2, String>) -> List<&2, String>:
  match cut:
    case True{}:
      fix(String.reverse(cur)) <> acc
    case False{}:
      acc

def split.cur(+cut: Bool, +h: Char, +cur: String) -> String:
  match cut:
    case True{}:
      ""
    case False{}:
      SCon{h, cur}

def split.go(+s: String, +cur: String, +acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      List.reverse(&2, String, fix(String.reverse(cur)) <> acc)
    case SCon{+h, t}:
      +cut = Char.is_eq(h, ' ')
      split.go(t, split.cur(cut, h, cur), split.acc(cut, cur, acc))

# responseText.split(" "), then the Meteohub fix: a lone "-" reads as "0".
# Walks the text once, keeping the current field and the fields so far
# reversed, so it runs as a loop however long the file is.
def split(+s: String) -> List<&2, String>:
  split.go(s, "", [])

# array[i]; a field past the end reads as undefined, as in the original.
def at(+xs: List<&2, String>, +i: Nat) -> String:
  Maybe.default(&2, String, List.get(&2, String, xs, i), "undefined")

def length(+xs: List<&2, String>) -> Nat:
  List.length(&2, String, xs)

# Array.prototype.equals for two field lists.
def same(+xs: List<&2, String>, +ys: List<&2, String>) -> Bool:
  match xs ys:
    case Nil{} Nil{}:
      True{}
    case Con{x, xt} Con{y, yt}:
      String.eq(x, y) && same(xt, yt)
    case _ _:
      False{}
