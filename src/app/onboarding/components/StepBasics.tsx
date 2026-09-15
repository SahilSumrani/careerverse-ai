import { Input, Label, Select } from "@/components/ui/input";

interface StepBasicsProps {
  name: string;
  roleIntent: string;
  onUpdate: (patch: { name?: string; roleIntent?: string; careerStage?: string }) => void;
  careerStage: string;
}

export function StepBasics({ name, roleIntent, onUpdate, careerStage }: StepBasicsProps) {
  return (
    <div className="cv-onboard-fields">
      <h2>About you</h2>
      <p>We’ll use this across your dashboard and match scores.</p>
      <Label htmlFor="name">Full name</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => onUpdate({ name: e.target.value })}
      />
      <Label htmlFor="roleIntent">I am joining as</Label>
      <Select
        id="roleIntent"
        value={roleIntent}
        onChange={(e) =>
          onUpdate({
            roleIntent: e.target.value,
            careerStage: e.target.value === "HR" ? "MID_CAREER" : careerStage,
          })
        }
      >
        <option value="STUDENT">Student / Job seeker</option>
        <option value="PROFESSIONAL">Professional</option>
        <option value="HR">Recruiter / HR</option>
        <option value="FOUNDER">Founder</option>
        <option value="MENTOR">Mentor</option>
      </Select>
    </div>
  );
}
