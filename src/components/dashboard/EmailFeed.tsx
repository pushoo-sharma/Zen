import EmailCard from "./EmailCard";

interface EmailFeedProps {
  emails: any[];
}

const EmailFeed = ({ emails }: EmailFeedProps) => {
  const priorityEmails = emails.filter(e => e.priority === "Priority");
  const actionEmails = emails.filter(e => e.priority === "Action Needed");
  const infoEmails = emails.filter(e => e.priority === "Informational");

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-6 space-y-8">
        {/* Priority Section */}
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <h2 className="text-xl font-semibold">Priority</h2>
            <span className="text-sm text-muted-foreground">({priorityEmails.length})</span>
          </div>
          <div className="space-y-3">
            {priorityEmails.map(email => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        </div>

        {/* Action Needed Section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <h2 className="text-xl font-semibold">Action Needed</h2>
            <span className="text-sm text-muted-foreground">({actionEmails.length})</span>
          </div>
          <div className="space-y-3">
            {actionEmails.map(email => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        </div>

        {/* Informational Section */}
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <h2 className="text-xl font-semibold">Informational</h2>
            <span className="text-sm text-muted-foreground">({infoEmails.length})</span>
          </div>
          <div className="space-y-3">
            {infoEmails.map(email => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailFeed;
